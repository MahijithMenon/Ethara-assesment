from decimal import Decimal
from typing import List

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.core.exceptions import (
    InsufficientStockError,
    NotFoundError,
    ValidationError,
)
from app.models.customer import Customer
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.schemas.order import OrderCreate


def _aggregate_items(items) -> dict[int, int]:
    """Combine repeated product entries into one row per product."""
    aggregated: dict[int, int] = {}
    for item in items:
        if item.quantity <= 0:
            raise ValidationError("Item quantity must be positive")
        aggregated[item.product_id] = aggregated.get(item.product_id, 0) + item.quantity
    return aggregated


def create_order(db: Session, data: OrderCreate) -> Order:
    customer = db.get(Customer, data.customer_id)
    if not customer:
        raise NotFoundError(f"Customer {data.customer_id} not found")

    aggregated = _aggregate_items(data.items)
    if not aggregated:
        raise ValidationError("Order must contain at least one item")

    # Lock the involved product rows for the duration of the transaction so two concurrent
    # orders cannot oversell the same SKU. SELECT ... FOR UPDATE is held until commit/rollback.
    product_ids = list(aggregated.keys())
    products = list(
        db.scalars(
            select(Product).where(Product.id.in_(product_ids)).with_for_update()
        ).all()
    )

    found_ids = {p.id for p in products}
    missing = set(product_ids) - found_ids
    if missing:
        raise NotFoundError(f"Product(s) not found: {sorted(missing)}")

    by_id = {p.id: p for p in products}

    total = Decimal("0")
    line_items: List[OrderItem] = []
    for pid, qty in aggregated.items():
        product = by_id[pid]
        if product.quantity_in_stock < qty:
            raise InsufficientStockError(
                f"Insufficient stock for '{product.name}' (SKU {product.sku}): "
                f"requested {qty}, available {product.quantity_in_stock}"
            )
        product.quantity_in_stock -= qty
        line_total = (product.price * qty).quantize(Decimal("0.01"))
        total += line_total
        line_items.append(
            OrderItem(
                product_id=product.id,
                quantity=qty,
                unit_price=product.price,
                line_total=line_total,
            )
        )

    order = Order(
        customer_id=customer.id,
        total_amount=total.quantize(Decimal("0.01")),
        status="placed",
        items=line_items,
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


def list_orders(db: Session) -> list[dict]:
    """Returns lightweight summaries — used by the order list page."""
    stmt = (
        select(
            Order.id,
            Order.customer_id,
            Customer.full_name.label("customer_name"),
            Order.total_amount,
            Order.status,
            func.count(OrderItem.id).label("item_count"),
            Order.created_at,
        )
        .join(Customer, Customer.id == Order.customer_id)
        .outerjoin(OrderItem, OrderItem.order_id == Order.id)
        .group_by(Order.id, Customer.full_name)
        .order_by(Order.created_at.desc())
    )
    return [dict(row._mapping) for row in db.execute(stmt).all()]


def get_order(db: Session, order_id: int) -> Order:
    order = db.scalar(
        select(Order)
        .options(selectinload(Order.items).joinedload(OrderItem.product))
        .where(Order.id == order_id)
    )
    if not order:
        raise NotFoundError(f"Order {order_id} not found")
    return order


def serialize_order_detail(order: Order) -> dict:
    return {
        "id": order.id,
        "customer_id": order.customer_id,
        "customer": order.customer,
        "total_amount": order.total_amount,
        "status": order.status,
        "created_at": order.created_at,
        "updated_at": order.updated_at,
        "items": [
            {
                "id": item.id,
                "product_id": item.product_id,
                "product_name": item.product.name,
                "product_sku": item.product.sku,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "line_total": item.line_total,
            }
            for item in order.items
        ],
    }


def delete_order(db: Session, order_id: int) -> None:
    """Cancel/delete an order and restock the products atomically."""
    order = db.scalar(
        select(Order).options(selectinload(Order.items)).where(Order.id == order_id)
    )
    if not order:
        raise NotFoundError(f"Order {order_id} not found")

    product_ids = [item.product_id for item in order.items]
    if product_ids:
        products = list(
            db.scalars(
                select(Product).where(Product.id.in_(product_ids)).with_for_update()
            ).all()
        )
        by_id = {p.id: p for p in products}
        for item in order.items:
            product = by_id.get(item.product_id)
            if product is not None:
                product.quantity_in_stock += item.quantity

    db.delete(order)
    db.commit()
