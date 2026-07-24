from sqlalchemy.orm import Session
from datetime import datetime, timezone
from backend.models.capital import Invoice, Payment, ApprovalRequest

class FinanceDashboardService:
    @staticmethod
    def get_dashboard_data(db: Session) -> dict:
        """Compiles stats, aging buckets, and transaction feeds for the dashboard."""
        invoices = db.query(Invoice).all()
        payments = db.query(Payment).all()
        approvals = db.query(ApprovalRequest).all()

        now = datetime.now(timezone.utc)
        current_month = now.month
        current_year = now.year

        # 1. Calculate Stats
        outstanding = 0.0
        overdue = 0.0
        paid_month = 0.0

        # Aging buckets
        buckets = {
            "0-30 Days": 0.0,
            "31-60 Days": 0.0,
            "61-90 Days": 0.0,
            "90+ Days": 0.0
        }

        for inv in invoices:
            due = inv.due_date.replace(tzinfo=timezone.utc) if inv.due_date.tzinfo is None else inv.due_date
            
            # Check overdue status
            is_overdue = inv.status == "overdue" or (inv.status == "sent" and due < now)
            
            if inv.status in ["sent", "overdue"] or (inv.status == "sent" and is_overdue):
                outstanding += inv.amount
                if is_overdue:
                    overdue += inv.amount
                    
                    # Calculate aging
                    days_past = (now - due).days
                    if days_past <= 30:
                        buckets["0-30 Days"] += inv.amount
                    elif days_past <= 60:
                        buckets["31-60 Days"] += inv.amount
                    elif days_past <= 90:
                        buckets["61-90 Days"] += inv.amount
                    else:
                        buckets["90+ Days"] += inv.amount

        # Payments this month
        for p in payments:
            pay_date = p.payment_date.replace(tzinfo=timezone.utc) if p.payment_date.tzinfo is None else p.payment_date
            if pay_date.month == current_month and pay_date.year == current_year:
                paid_month += p.amount

        # Approvals
        pending_apps = sum(1 for a in approvals if a.status == "pending")

        return {
            "stats": {
                "outstanding_revenue": outstanding,
                "paid_this_month": paid_month,
                "overdue_revenue": overdue,
                "pending_approvals": pending_apps
            },
            "aging_buckets": buckets,
            "invoices": invoices,
            "payments": payments,
            "approvals": approvals
        }
    
    @staticmethod
    def get_collection_risks(db: Session) -> list[dict]:
        """Identifies customer accounts carrying high collection risks."""
        invoices = db.query(Invoice).filter(Invoice.status == "overdue").all()
        risks = []
        for inv in invoices:
            due = inv.due_date.replace(tzinfo=timezone.utc) if inv.due_date.tzinfo is None else inv.due_date
            days = (datetime.now(timezone.utc) - due).days
            
            if days >= 30:
                risk_tier = "high"
            elif days >= 15:
                risk_tier = "medium"
            else:
                risk_tier = "low"
                
            risks.append({
                "invoice_number": inv.invoice_number,
                "customer_name": inv.customer_name,
                "amount": inv.amount,
                "days_overdue": days,
                "risk_tier": risk_tier
            })
        return risks
