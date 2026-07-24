from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from backend.database.session import get_db
from backend.services.workflow_service import WorkflowService
from backend.services.execution_service import ExecutionService
from backend.schemas.workflow import (
    WorkflowCreate,
    WorkflowResponse,
    WorkflowNodeSchema,
    WorkflowEdgeSchema,
    WorkflowExecutionResponse,
    WorkflowExecutionLogResponse
)

router = APIRouter(prefix="/workflows", tags=["Visual Workflow Builder"])

@router.post("", response_model=WorkflowResponse)
def create_workflow_endpoint(request: WorkflowCreate, db: Session = Depends(get_db)):
    """Saves a new visual workflow canvas along with its node layout and connection edges."""
    wf = WorkflowService.create_workflow(request, db)
    return map_workflow_response(wf)

@router.get("", response_model=List[WorkflowResponse])
def list_workflows_endpoint(db: Session = Depends(get_db)):
    """Lists all workflows registered in the system."""
    items = WorkflowService.list_workflows(db)
    return [map_workflow_response(item) for item in items]

@router.get("/{workflow_id}", response_model=WorkflowResponse)
def get_workflow_endpoint(workflow_id: int, db: Session = Depends(get_db)):
    """Retrieves details of a specific workflow."""
    wf = WorkflowService.get_workflow(workflow_id, db)
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return map_workflow_response(wf)

@router.post("/{workflow_id}/execute", response_model=WorkflowExecutionResponse)
def execute_workflow_endpoint(workflow_id: int, request_context: Dict[str, Any], db: Session = Depends(get_db)):
    """Manually triggers workflow traversal run on a lead context."""
    service = ExecutionService()
    try:
        execution = service.execute_workflow(workflow_id, request_context, db)
        return map_execution_response(execution)
    except ValueError as err:
        raise HTTPException(status_code=404, detail=str(err))

@router.get("/{workflow_id}/executions", response_model=List[WorkflowExecutionResponse])
def get_workflow_executions_endpoint(workflow_id: int, db: Session = Depends(get_db)):
    """Pulls the historical execution logs for a workflow."""
    executions = WorkflowService.get_executions(workflow_id, db)
    return [map_execution_response(e) for e in executions]

# Helper mappers
def map_workflow_response(wf) -> WorkflowResponse:
    return WorkflowResponse(
        id=wf.id,
        name=wf.name,
        description=wf.description,
        status=wf.status,
        created_at=wf.created_at,
        nodes=[WorkflowNodeSchema(id=n.id, node_type=n.node_type, config=n.config) for n in wf.nodes],
        edges=[WorkflowEdgeSchema(source_node=e.source_node, target_node=e.target_node) for e in wf.edges]
    )

def map_execution_response(e) -> WorkflowExecutionResponse:
    return WorkflowExecutionResponse(
        id=e.id,
        workflow_id=e.workflow_id,
        status=e.status,
        started_at=e.started_at,
        completed_at=e.completed_at,
        logs=[WorkflowExecutionLogResponse(
            id=log.id,
            execution_id=log.execution_id,
            node_id=log.node_id,
            node_type=log.node_type,
            status=log.status,
            execution_time=log.execution_time,
            result_data=log.result_data,
            error_details=log.error_details
        ) for log in e.logs]
    )
