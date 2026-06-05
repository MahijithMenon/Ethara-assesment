from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.config import settings
from app.models.customer import Customer
from app.models.order import Order
from app.models.product import Product


def get_dashboard_stats(db: Session) -> dict:
    total_products = db.scalar(select(func.count()).select_from(Product)) or 0
    total_customers = db.scalar(select(func.count()).select_from(Customer)) or 0
    total_orders = db.scalar(select(func.count()).select_from(Order)) or 0
    revenue = db.scalar(select(func.coalesce(func.sum(Order.total_amount), 0))) or Decimal("0")

    threshold = settings.LOW_STOCK_THRESHOLD
    low_stock = list(
        db.scalars(
            select(Product)
            .where(Product.quantity_in_stock <= threshold)
            .order_by(Product.quantity_in_stock.asc())
            .limit(10)
        ).all()
    )

    return {
        "total_products": total_products,
        "total_customers": total_customers,
        "total_orders": total_orders,
        "revenue": revenue,
        "low_stock_threshold": threshold,
        "low_stock_products": low_stock,
    }
