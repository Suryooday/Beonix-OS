from sqlalchemy.orm import Session
from datetime import datetime, timezone
from backend.models.compliance import ComplianceRequirement, ComplianceRisk, ComplianceDocument
from backend.models.lead import Lead
from backend.models.activity import Activity

class RiskService:
    @staticmethod
    def get_days_inactive(lead: Lead, db: Session) -> int:
        if not lead:
            return 0
        latest_act = db.query(Activity).filter(Activity.lead_id == lead.id).order_by(Activity.timestamp.desc()).first()
        now = datetime.now(timezone.utc)
        
        def get_tz_date(d):
            if d is None:
                return now
            return d.replace(tzinfo=timezone.utc) if d.tzinfo is None else d

        last_date = get_tz_date(latest_act.timestamp) if latest_act else get_tz_date(lead.created_at)
        return max(0, (now - last_date).days)

    @staticmethod
    def detect_stale_leads(db: Session, threshold_days: int = 14) -> list[Lead]:
        leads = db.query(Lead).filter(Lead.stage.notin_(["Won", "Lost"])).all()
        stale_leads = []
        for lead in leads:
            days = RiskService.get_days_inactive(lead, db)
            if days >= threshold_days:
                stale_leads.append(lead)
        return stale_leads

    @staticmethod
    def calculate_risk(lead: Lead, db: Session) -> dict:
        days = RiskService.get_days_inactive(lead, db)
        stage = lead.stage if lead else "New"
        
        risk_level = "low"
        reason = "Opportunity is active with recent engagement."
        
        if days >= 30:
            risk_level = "critical"
            reason = f"No activity logged in the past {days} days."
        elif days >= 14:
            if stage in ["Proposal", "Negotiation"]:
                risk_level = "high"
                reason = f"Proposal sent but no engagement for {days} days."
            else:
                risk_level = "medium"
                reason = f"Lead has been inactive in stage '{stage}' for {days} days."
                
        return {
            "risk_level": risk_level,
            "reason": reason,
            "days_inactive": days
        }
    @staticmethod
    def analyze_requirements(db: Session) -> list[ComplianceRisk]:
        """Runs the compliance risk rules engine and logs alert assessments."""
        # Clean current risks first
        db.query(ComplianceRisk).delete()
        db.commit()

        reqs = db.query(ComplianceRequirement).all()
        now = datetime.now(timezone.utc)
        new_risks = []

        for req in reqs:
            due = req.due_date.replace(tzinfo=timezone.utc) if req.due_date.tzinfo is None else req.due_date
            delta = (due - now).days
            
            severity = None
            desc = ""
            reco = ""

            # Check if document is missing
            has_doc = db.query(ComplianceDocument).filter(
                ComplianceDocument.requirement_id == req.id,
                ComplianceDocument.verification_status == "verified"
            ).first() is not None

            # Risk Engine Rules
            if due < now:
                severity = "critical"
                desc = f"Filing deadline exceeded for '{req.title}'."
                reco = "Submit filing immediately and review late fees."
                req.status = "overdue"
            elif delta <= 3:
                severity = "high"
                desc = f"Approaching critical deadline for '{req.title}' in {delta} days."
                reco = "Assign resources to finish and upload verify docs."
                req.status = "at_risk"
            elif delta <= 7:
                severity = "medium"
                desc = f"Filing due for '{req.title}' in {delta} days."
                reco = "Review documentation drafts and submit."
                req.status = "at_risk"
            elif not has_doc and req.category in ["GST", "MCA", "Tax"]:
                severity = "high"
                desc = f"Missing required verification document for '{req.title}'."
                reco = "Upload certificates or filings receipts for verification."
                req.status = "at_risk"

            if severity:
                db_risk = ComplianceRisk(
                    requirement_id=req.id,
                    severity=severity,
                    description=desc,
                    recommendation=reco
                )
                db.add(db_risk)
                new_risks.append(db_risk)

        db.commit()
        return new_risks
