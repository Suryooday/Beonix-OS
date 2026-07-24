from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Dict, Any

class WorkflowNodeSchema(BaseModel):
    id: str
    node_type: str
    config: Optional[Dict[str, Any]] = None

class WorkflowEdgeSchema(BaseModel):
    source_node: str
    target_node: str

class WorkflowCreate(BaseModel):
    name: str
    description: Optional[str] = None
    status: str = "draft"  # active, inactive, draft
    nodes: List[WorkflowNodeSchema] = []
    edges: List[WorkflowEdgeSchema] = []

class WorkflowResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    status: str
    created_at: datetime
    nodes: List[WorkflowNodeSchema] = []
    edges: List[WorkflowEdgeSchema] = []

    class Config:
        from_attributes = True

class WorkflowExecutionLogResponse(BaseModel):
    id: int
    execution_id: int
    node_id: str
    node_type: str
    status: str
    execution_time: datetime
    result_data: Optional[str] = None
    error_details: Optional[str] = None

    class Config:
        from_attributes = True

class WorkflowExecutionResponse(BaseModel):
    id: int
    workflow_id: int
    status: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    logs: List[WorkflowExecutionLogResponse] = []

    class Config:
        from_attributes = True
