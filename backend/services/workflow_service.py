from sqlalchemy.orm import Session
from typing import List, Optional
from backend.models.workflow import Workflow, WorkflowNode, WorkflowEdge, WorkflowExecution
from backend.schemas.workflow import WorkflowCreate

class WorkflowService:
    @staticmethod
    def create_workflow(data: WorkflowCreate, db: Session) -> Workflow:
        """Saves a new visual workflow canvas along with its node layout and connection edges."""
        db_workflow = Workflow(
            name=data.name,
            description=data.description,
            status=data.status
        )
        db.add(db_workflow)
        db.commit()
        db.refresh(db_workflow)

        # Add Nodes
        for n in data.nodes:
            db_node = WorkflowNode(
                id=n.id,
                workflow_id=db_workflow.id,
                node_type=n.node_type,
                config=n.config
            )
            db.add(db_node)

        # Add Edges
        for e in data.edges:
            db_edge = WorkflowEdge(
                workflow_id=db_workflow.id,
                source_node=e.source_node,
                target_node=e.target_node
            )
            db.add(db_edge)

        db.commit()
        db.refresh(db_workflow)
        return db_workflow

    @staticmethod
    def list_workflows(db: Session) -> List[Workflow]:
        """Lists all workflows registered in the system."""
        all_wf = db.query(Workflow).all()
        if not all_wf:
            WorkflowService.seed_default_templates(db)
            return db.query(Workflow).all()
        return all_wf

    @staticmethod
    def get_workflow(workflow_id: int, db: Session) -> Optional[Workflow]:
        """Retrieves details of a specific workflow."""
        return db.query(Workflow).filter(Workflow.id == workflow_id).first()

    @staticmethod
    def get_executions(workflow_id: int, db: Session) -> List[WorkflowExecution]:
        """Pulls the historical execution logs for a workflow."""
        return db.query(WorkflowExecution).filter(WorkflowExecution.workflow_id == workflow_id).order_by(WorkflowExecution.started_at.desc()).all()

    @staticmethod
    def seed_default_templates(db: Session):
        """Seeds default starter templates for user convenience."""
        templates = [
            {
                "name": "High Value Lead Follow-Up",
                "description": "Trigger an urgent call when a lead scores higher than 80.",
                "status": "active",
                "nodes": [
                    {"id": "node_1", "node_type": "New Lead", "config": {}},
                    {"id": "node_2", "node_type": "Score Greater Than", "config": {"value": 80}},
                    {"id": "node_3", "node_type": "Create Follow-Up", "config": {"type": "call", "title": "Urgent recovery call"}},
                    {"id": "node_4", "node_type": "Send Notification", "config": {"message": "High value lead registered!"}}
                ],
                "edges": [
                    {"source_node": "node_1", "target_node": "node_2"},
                    {"source_node": "node_2", "target_node": "node_3"},
                    {"source_node": "node_3", "target_node": "node_4"}
                ]
            },
            {
                "name": "Cold Lead Recovery",
                "description": "Escalates cold leads automatically to the Recovery Queue after 14 days of inactivity.",
                "status": "active",
                "nodes": [
                    {"id": "node_a", "node_type": "Scheduled Event", "config": {}},
                    {"id": "node_b", "node_type": "Days Since Activity", "config": {"value": 14}},
                    {"id": "node_c", "node_type": "Create Recovery Case", "config": {}},
                    {"id": "node_d", "node_type": "Send Notification", "config": {"message": "Lead Recovery Case generated."}}
                ],
                "edges": [
                    {"source_node": "node_a", "target_node": "node_b"},
                    {"source_node": "node_b", "target_node": "node_c"},
                    {"source_node": "node_c", "target_node": "node_d"}
                ]
            }
        ]

        for temp in templates:
            wf = Workflow(name=temp["name"], description=temp["description"], status=temp["status"])
            db.add(wf)
            db.commit()
            db.refresh(wf)
            
            for node in temp["nodes"]:
                db_n = WorkflowNode(id=node["id"], workflow_id=wf.id, node_type=node["node_type"], config=node["config"])
                db.add(db_n)
            for edge in temp["edges"]:
                db_e = WorkflowEdge(workflow_id=wf.id, source_node=edge["source_node"], target_node=edge["target_node"])
                db.add(db_e)
            db.commit()
