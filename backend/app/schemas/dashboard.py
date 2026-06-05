from decimal import Decimal
from typing import List

from pydantic import BaseModel

from app.schemas.common import ORMModel


class LowStockProduct(ORMModel):
    id: int
    name: str
    sku: str
    quantity_in_stock: int


class DashboardStats(BaseModel):
    total_products: int
    total_customers: int
    total_orders: int
    revenue: Decimal
    low_stock_threshold: int
    low_stock_products: List[LowStockProduct]
