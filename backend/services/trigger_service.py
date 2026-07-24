from typing import Dict, Any

class TriggerService:
    @staticmethod
    def evaluate_trigger(trigger_type: str, event_data: Dict[str, Any], config: Dict[str, Any]) -> bool:
        """Determines if the event payload matches the trigger criteria."""
        # Simple match triggers: if trigger matches the event category
        if trigger_type == "New Lead":
            return True
        if trigger_type == "Lead Stage Changed":
            # Check if stage config matches
            target_stage = config.get("stage")
            if target_stage:
                return event_data.get("stage") == target_stage
            return True
        if trigger_type == "Invoice Overdue":
            return True
        if trigger_type == "New Document Uploaded":
            return True
        
        return True
