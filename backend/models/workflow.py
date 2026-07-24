from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from backend.database.session import Base

class Workflow(Base):
    __tablename__ = "workflows"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String, default="draft")  # active, inactive, draft
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    nodes = relationship("WorkflowNode", back_populates="workflow", cascade="all, delete-orphan")
    edges = relationship("WorkflowEdge", back_populates="workflow", cascade="all, delete-orphan")
    executions = relationship("WorkflowExecution", back_populates="workflow", cascade="all, delete-orphan")

class WorkflowNode(Base):
    __tablename__ = "workflow_nodes"

    id = Column(String, primary_key=True, index=True)  # unique within workflow (e.g., node_1)
    workflow_id = Column(Integer, ForeignKey("workflows.id", ondelete="CASCADE"), primary_key=True)
    node_type = Column(String, nullable=False)  # trigger, condition, action
    config = Column(JSON, nullable=True)

    workflow = relationship("Workflow", back_populates="nodes")

class WorkflowEdge(Base):
    __tablename__ = "workflow_edges"

    id = Column(Integer, primary_key=True, index=True)
    workflow_id = Column(Integer, ForeignKey("workflows.id", ondelete="CASCADE"), nullable=False)
    source_node = Column(String, nullable=False)
    target_node = Column(String, nullable=False)

    workflow = relationship("Workflow", back_populates="edges")

class WorkflowExecution(Base):
    __tablename__ = "workflow_executions"

    id = Column(Integer, primary_key=True, index=True)
    workflow_id = Column(Integer, ForeignKey("workflows.id", ondelete="CASCADE"), nullable=False)
    status = Column(String, default="pending")  # pending, running, completed, failed
    started_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    completed_at = Column(DateTime, nullable=True)

    workflow = relationship("Workflow", back_populates="executions")
    logs = relationship("WorkflowExecutionLog", back_populates="execution", cascade="all, delete-orphan")

class WorkflowExecutionLog(Base):
    __tablename__ = "workflow_execution_logs"

    id = Column(Integer, primary_key=True, index=True)
    execution_id = Column(Integer, ForeignKey("workflow_executions.id", ondelete="CASCADE"), nullable=False)
    node_id = Column(String, nullable=False)
    node_type = Column(String, nullable=False)
    status = Column(String, nullable=False)  # success, failed
    execution_time = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    result_data = Column(Text, nullable=True)
    error_details = Column(Text, nullable=True)

    execution = relationship("WorkflowExecution", back_populates="logs")
