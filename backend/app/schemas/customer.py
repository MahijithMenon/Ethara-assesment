from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.schemas.common import ORMModel


class CustomerBase(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    phone_number: str = Field(..., min_length=3, max_length=32)

    @field_validator("full_name", "phone_number")
    @classmethod
    def _strip(cls, v: str) -> str:
        return v.strip()


class CustomerCreate(CustomerBase):
    pass


class CustomerRead(ORMModel):
    id: int
    full_name: str
    email: EmailStr
    phone_number: str
    created_at: datetime
    updated_at: datetime
