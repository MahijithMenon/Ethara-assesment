from datetime import datetime
from decimal import Decimal
from typing import List

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel
from app.schemas.customer import CustomerRead


class OrderItemCreate(BaseModel):
    product_id: int = Field(..., gt=0)
    quantity: int = Field(..., gt=0)


class OrderCreate(BaseModel):
    customer_id: int = Field(..., gt=0)
    items: List[OrderItemCreate] = Field(..., min_length=1)


class OrderItemRead(ORMModel):
    id: int
    product_id: int
    product_name: str
    product_sku: str
    quantity: int
    unit_price: Decimal
    line_total: Decimal


class OrderSummary(ORMModel):
    id: int
    customer_id: int
    customer_name: str
    total_amount: Decimal
    status: str
    item_count: int
    created_at: datetime


class OrderRead(ORMModel):
    id: int
    customer_id: int
    customer: CustomerRead
    total_amount: Decimal
    status: str
    items: List[OrderItemRead]
    created_at: datetime
    updated_at: datetime
