from datetime import datetime, timezone
from backend.models.capital import Invoice

class DunningService:
    @staticmethod
    def get_dunning_level(invoice: Invoice) -> dict:
        """Determines the dunning actions and reminder copy based on overdue days."""
        now = datetime.now(timezone.utc)
        due = invoice.due_date.replace(tzinfo=timezone.utc) if invoice.due_date.tzinfo is None else invoice.due_date

        days_overdue = max(0, (now - due).days)

        if days_overdue >= 30:
            level = "Escalation"
            subject = f"URGENT: Legal escalation warning for Invoice {invoice.invoice_number}"
            body = (
                f"Dear {invoice.customer_name},\n\n"
                f"Despite multiple reminders, payment for Invoice {invoice.invoice_number} "
                f"(${invoice.amount}) remains outstanding by {days_overdue} days.\n\n"
                f"Please settle the pending balance immediately to prevent account suspension and escalation "
                f"to legal/collections agencies."
            )
            script = f"Initiate collections escalation call with {invoice.customer_name} for outstanding ${invoice.amount}."
            notes = "Logged final collections escalation notification. Preparing legal files."
        elif days_overdue >= 15:
            level = "Level 2"
            subject = f"Second Reminder: Past-due Invoice {invoice.invoice_number}"
            body = (
                f"Dear {invoice.customer_name},\n\n"
                f"This is a second reminder that payment for Invoice {invoice.invoice_number} "
                f"(${invoice.amount}) is past-due by {days_overdue} days.\n\n"
                f"Please update payment coordinates and settle the pending balance immediately."
            )
            script = f"Follow up on pending sync responses with {invoice.customer_name} for {invoice.invoice_number}."
            notes = "Sent Level 2 past-due notification."
        elif days_overdue >= 7:
            level = "Level 1"
            subject = f"Payment Reminder: Invoice {invoice.invoice_number} is past due"
            body = (
                f"Dear {invoice.customer_name},\n\n"
                f"This is a friendly reminder that Invoice {invoice.invoice_number} "
                f"for ${invoice.amount} was due on {invoice.due_date.strftime('%Y-%m-%d')}.\n\n"
                f"We kindly request you to process the pending payment."
            )
            script = f"Friendly call check-in with {invoice.customer_name} regarding outstanding balance."
            notes = "Sent Level 1 payment reminder."
        else:
            level = "None"
            subject = f"Invoice {invoice.invoice_number} notice"
            body = f"Invoice {invoice.invoice_number} is active."
            script = "No phone sync actions required."
            notes = "Invoice remains within active terms."

        return {
            "level": level,
            "days_overdue": days_overdue,
            "email_subject": subject,
            "email_body": body,
            "call_script": script,
            "collection_notes": notes
        }
