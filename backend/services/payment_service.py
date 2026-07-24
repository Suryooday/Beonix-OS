from sqlalchemy.orm import Session
from typing import List
from backend.models.capital import Payment, Invoice
from backend.schemas.capital import PaymentCreate

class PaymentService:
    @staticmethod
    def record_payment(data: PaymentCreate, db: Session) -> Payment:
        """Records a new invoice payment and marks the invoice paid."""
        invoice = db.query(Invoice).filter(Invoice.id == data.invoice_id).first()
        if not invoice:
            raise ValueError(f"Invoice ID {data.invoice_id} not found.")

        # Create payment
        db_payment = Payment(
            invoice_id=data.invoice_id,
            amount=data.amount,
            payment_method=data.payment_method
        )
        db.add(db_payment)
        
        # Mark invoice as paid
        invoice.status = "paid"
        
        db.commit()
        db.refresh(db_payment)
        return db_payment

    @staticmethod
    def list_payments(db: Session) -> List[Payment]:
        """Lists all recorded payments."""
        return db.query(Payment).order_by(Payment.payment_date.desc()).all()
