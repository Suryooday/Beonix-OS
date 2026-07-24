from typing import Dict, Any, List
from langgraph.graph import StateGraph, END
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from backend.models.workflow import Workflow, WorkflowNode, WorkflowEdge, WorkflowExecution, WorkflowExecutionLog
from backend.services.trigger_service import TriggerService
from backend.services.condition_service import ConditionService
from backend.services.action_service import ActionService

class ExecutionService:
    def execute_workflow(self, workflow_id: int, initial_context: Dict[str, Any], db: Session) -> WorkflowExecution:
        """Builds a LangGraph state machine from visual nodes/edges and executes it."""
        workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
        if not workflow:
            raise ValueError(f"Workflow ID {workflow_id} not found.")

        # Initialize execution run log
        exec_record = WorkflowExecution(
            workflow_id=workflow_id,
            status="running",
            started_at=datetime.now(timezone.utc)
        )
        db.add(exec_record)
        db.commit()
        db.refresh(exec_record)

        # 1. Fetch nodes and edges
        nodes = db.query(WorkflowNode).filter(WorkflowNode.workflow_id == workflow_id).all()
        edges = db.query(WorkflowEdge).filter(WorkflowEdge.workflow_id == workflow_id).all()

        if not nodes:
            exec_record.status = "failed"
            exec_record.completed_at = datetime.now(timezone.utc)
            db.commit()
            return exec_record

        # Identify starting node (node with zero incoming edges)
        incoming = {edge.target_node for edge in edges}
        triggers = [n for n in nodes if n.id not in incoming]
        start_node_id = triggers[0].id if triggers else nodes[0].id

        # 2. Build Node Runners
        def make_node_runner(node_item):
            def run_node(state: dict) -> dict:
                context = state["context"]
                logs = state["logs"]
                
                log_entry = {
                    "node_id": node_item.id,
                    "node_type": node_item.node_type,
                    "status": "success",
                    "execution_time": datetime.now(timezone.utc),
                    "result_data": None,
                    "error_details": None
                }

                try:
                    # Evaluate Triggers (pass-through success)
                    if node_item.node_type in ["New Lead", "Lead Stage Changed", "Invoice Overdue", "New Document Uploaded"]:
                        log_entry["result_data"] = f"Trigger matches: {node_item.node_type}"
                    
                    # Evaluate Conditions (set branch result flag)
                    elif node_item.node_type in ["Score Greater Than", "Stage Equals", "Risk Level Equals", "Days Since Activity"]:
                        result = ConditionService.evaluate_condition(node_item.node_type, context, node_item.config or {})
                        log_entry["result_data"] = f"Condition evaluates to: {result}"
                        state["last_condition_result"] = result
                    
                    # Execute Actions
                    elif node_item.node_type in ["Create Follow-Up", "Create Recovery Case", "Send Notification", "Update Stage"]:
                        res = ActionService.execute_action(node_item.node_type, context, node_item.config or {}, db)
                        if res.get("success"):
                            log_entry["result_data"] = res.get("info")
                        else:
                            log_entry["status"] = "failed"
                            log_entry["error_details"] = res.get("error")
                            state["failed"] = True
                    else:
                        log_entry["result_data"] = f"Triggered no-op node: {node_item.node_type}"

                except Exception as err:
                    log_entry["status"] = "failed"
                    log_entry["error_details"] = str(err)
                    state["failed"] = True

                logs.append(log_entry)
                return state
            return run_node

        # 3. Create LangGraph State Graph
        builder = StateGraph(dict)

        for node in nodes:
            builder.add_node(node.id, make_node_runner(node))

        # Add connections and conditional routing
        for node in nodes:
            out_edges = [edge for edge in edges if edge.source_node == node.id]
            if not out_edges:
                builder.add_edge(node.id, END)
                continue

            # Route conditionally for branch nodes
            if node.node_type in ["Score Greater Than", "Stage Equals", "Risk Level Equals", "Days Since Activity"]:
                targets = [edge.target_node for edge in out_edges]
                
                def make_router(t_list=targets):
                    def route_path(state: dict) -> str:
                        if state.get("failed"):
                            return END
                        # Route: first target if True, second target (or END) if False
                        return t_list[0] if state.get("last_condition_result", True) else (t_list[1] if len(t_list) > 1 else END)
                    return route_path

                path_map = {t: t for t in targets}
                path_map[END] = END
                builder.add_conditional_edges(node.id, make_router(), path_map)
            else:
                # Sequential routing
                builder.add_edge(node.id, out_edges[0].target_node)

        # Set Start Node
        builder.set_entry_point(start_node_id)
        graph = builder.compile()

        # 4. Invoke graph
        initial_state = {
            "context": initial_context,
            "logs": [],
            "last_condition_result": True,
            "failed": False
        }

        try:
            final_state = graph.invoke(initial_state)
            has_failures = False
            for log_entry in final_state["logs"]:
                db_log = WorkflowExecutionLog(
                    execution_id=exec_record.id,
                    node_id=log_entry["node_id"],
                    node_type=log_entry["node_type"],
                    status=log_entry["status"],
                    result_data=log_entry["result_data"],
                    error_details=log_entry["error_details"],
                    execution_time=log_entry["execution_time"]
                )
                db.add(db_log)
                if log_entry["status"] == "failed":
                    has_failures = True

            exec_record.status = "failed" if (has_failures or final_state.get("failed")) else "completed"

        except Exception as e:
            exec_record.status = "failed"
            db_log = WorkflowExecutionLog(
                execution_id=exec_record.id,
                node_id="system",
                node_type="System",
                status="failed",
                error_details=str(e)
            )
            db.add(db_log)

        exec_record.completed_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(exec_record)
        return exec_record

    @staticmethod
    def execute_followup(followup_id: int, db: Session):
        from backend.models.followup import FollowUp, FollowUpExecution
        from backend.models.activity import Activity
        
        followup = db.query(FollowUp).filter(FollowUp.id == followup_id).first()
        if not followup:
            raise ValueError(f"Follow-up ID {followup_id} not found.")
        
        followup.status = "completed"
        db.add(followup)
        
        # Log to Lead Activity Timeline
        act = Activity(
            lead_id=followup.lead_id,
            type="System",
            content=f"Executed follow-up task: {followup.title}."
        )
        db.add(act)
        
        exec_entry = FollowUpExecution(
            followup_id=followup_id,
            execution_time=datetime.now(timezone.utc),
            execution_result=f"Completed {followup.followup_type} outreach successfully."
        )
        db.add(exec_entry)
        db.commit()
        db.refresh(exec_entry)
        return exec_entry
