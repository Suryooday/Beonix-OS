from pydantic import BaseModel, Field
from typing import List, Optional

class IngestedLeadInfo(BaseModel):
    name: Optional[str] = Field(
        None, 
        description="The full name of the lead. Set to null if not identifiable."
    )
    company: Optional[str] = Field(
        None, 
        description="The company name the lead is affiliated with. Set to null if not identifiable."
    )
    summary: str = Field(
        ..., 
        description="A concise 2-3 sentence summary of the communication or contact context."
    )
    intent: str = Field(
        ..., 
        description="The inferred intent of the communication (e.g., 'Purchase Inquiry', 'Feature request', 'Objection', 'Spam', 'Greeting')."
    )
    objections: List[str] = Field(
        default_factory=list,
        description="List of objections, hesitations, or obstacles explicitly raised by the lead (e.g., 'pricing', 'missing security certs')."
    )
    next_steps: List[str] = Field(
        default_factory=list,
        description="List of logical next steps or actions to take to move the lead forward (e.g., 'send pricing sheet', 'schedule demo')."
    )
