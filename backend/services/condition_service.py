from typing import Dict, Any

class ConditionService:
    @staticmethod
    def evaluate_condition(condition_type: str, context: Dict[str, Any], config: Dict[str, Any]) -> bool:
        """Evaluates a workflow condition against the active lead context."""
        val = config.get("value")
        if val is None:
            return True

        if condition_type == "Score Greater Than":
            score = context.get("lead_score", 0)
            return int(score) > int(val)

        if condition_type == "Stage Equals":
            stage = context.get("lead_stage", "")
            return str(stage).lower() == str(val).lower()

        if condition_type == "Risk Level Equals":
            risk = context.get("lead_risk", "low")
            return str(risk).lower() == str(val).lower()

        if condition_type == "Days Since Activity":
            days = context.get("days_inactive", 0)
            return int(days) >= int(val)

        return True
