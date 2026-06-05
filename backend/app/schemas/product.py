from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field, field_validator

from app.schemas.common import ORMModel


class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    sku: str = Field(..., min_length=1, max_length=64)
    price: Decimal = Field(..., ge=0, max_digits=12, decimal_places=2)
    quantity_in_stock: int = Field(..., ge=0)

    @field_validator("name", "sku")
    @classmethod
    def _strip(cls, v: str) -> str:
        return v.strip()


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    sku: Optional[str] = Field(None, min_length=1, max_length=64)
    price: Optional[Decimal] = Field(None, ge=0, max_digits=12, decimal_places=2)
    quantity_in_stock: Optional[int] = Field(None, ge=0)

    @field_validator("name", "sku")
    @classmethod
    def _strip(cls, v):
        return v.strip() if isinstance(v, str) else v


class ProductRead(ORMModel):
    id: int
    name: str
    sku: str
    price: Decimal
    quantity_in_stock: int
    created_at: datetime
    updated_at: datetime
