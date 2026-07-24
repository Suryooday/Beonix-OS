from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from backend.models.capital import Invoice
from backend.schemas.capital import InvoiceCreate

class InvoiceService:
    @staticmethod
    def create_invoice(data: InvoiceCreate, db: Session) -> Invoice:
        """Saves a new invoice record and sets initial sent status."""
        db_invoice = Invoice(
            invoice_number=data.invoice_number,
            customer_name=data.customer_name,
            amount=data.amount,
            due_date=data.due_date,
            status=data.status or "sent"
        )
        db.add(db_invoice)
        db.commit()
        db.refresh(db_invoice)
        return db_invoice

    @staticmethod
    def list_invoices(db: Session) -> List[Invoice]:
        """Lists all invoices registered in the system."""
        return db.query(Invoice).order_by(Invoice.created_at.desc()).all()

    @staticmethod
    def get_invoice(invoice_id: int, db: Session) -> Optional[Invoice]:
        """Retrieves a specific invoice details."""
        return db.query(Invoice).filter(Invoice.id == invoice_id).first()

    @staticmethod
    def update_invoice_status(invoice_id: int, status: str, db: Session) -> Invoice:
        """Updates the status of an invoice."""
        invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
        if not invoice:
            raise ValueError(f"Invoice ID {invoice_id} not found.")
        invoice.status = status
        db.commit()
        db.refresh(invoice)
        return invoice

    @staticmethod
    def search_invoices(query: str, db: Session) -> List[Invoice]:
        """Searches invoices by invoice number or customer name."""
        return db.query(Invoice).filter(
            or_(
                Invoice.invoice_number.ilike(f"%{query}%"),
                Invoice.customer_name.ilike(f"%{query}%")
            )
        ).all()
