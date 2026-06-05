from typing import List

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, NotFoundError
from app.models.customer import Customer
from app.models.order import Order
from app.schemas.customer import CustomerCreate


def list_customers(db: Session) -> List[Customer]:
    return list(db.scalars(select(Customer).order_by(Customer.created_at.desc())).all())


def get_customer(db: Session, customer_id: int) -> Customer:
    customer = db.get(Customer, customer_id)
    if not customer:
        raise NotFoundError(f"Customer {customer_id} not found")
    return customer


def create_customer(db: Session, data: CustomerCreate) -> Customer:
    existing = db.scalar(select(Customer.id).where(Customer.email == data.email))
    if existing is not None:
        raise ConflictError(
            f"Email '{data.email}' is already registered",
            code="email_conflict",
        )
    customer = Customer(**data.model_dump())
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


def delete_customer(db: Session, customer_id: int) -> None:
    customer = get_customer(db, customer_id)
    in_use = db.scalar(select(Order.id).where(Order.customer_id == customer.id).limit(1))
    if in_use is not None:
        raise ConflictError(
            "Cannot delete customer that has existing orders",
            code="customer_in_use",
        )
    db.delete(customer)
    db.commit()
