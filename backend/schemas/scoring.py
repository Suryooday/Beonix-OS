from pydantic import BaseModel, Field
from typing import Dict, Any

class FactorDetail(BaseModel):
    score: int = Field(..., ge=0, le=10, description="Score for this factor (0-10)")
    reason: str = Field(..., description="Short explanation for this factor's score")

class ScoringBreakdown(BaseModel):
    urgency: FactorDetail = Field(..., description="Urgency analysis score and reasoning")
    budget_signal: FactorDetail = Field(..., description="Budget availability signal score and reasoning")
    decision_maker: FactorDetail = Field(..., description="Decision maker presence score and reasoning")
    engagement: FactorDetail = Field(..., description="Interaction engagement level score and reasoning")
    sentiment: FactorDetail = Field(..., description="Lead conversation sentiment score and reasoning")

class ScoreResponse(BaseModel):
    lead_id: int = Field(..., description="The database ID of the scored lead")
    score: int = Field(..., ge=0, le=100, description="Derived final lead score (0-100)")
    priority: str = Field(..., description="Priority label: Low (0-39), Medium (40-69), High (70-100)")
    reasoning: ScoringBreakdown = Field(..., description="Structured scoring factor details")
