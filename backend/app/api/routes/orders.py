from typing import List

from fastapi import APIRouter, Response, status

from app.api.deps import DbSession
from app.schemas.order import OrderCreate, OrderRead, OrderSummary
from app.services import order_service

router = APIRouter(prefix="/orders", tags=["orders"])


@router.get("", response_model=List[OrderSummary])
def list_orders(db: DbSession):
    return order_service.list_orders(db)


@router.post("", response_model=OrderRead, status_code=status.HTTP_201_CREATED)
def create_order(payload: OrderCreate, db: DbSession):
    order = order_service.create_order(db, payload)
    return order_service.serialize_order_detail(order)


@router.get("/{order_id}", response_model=OrderRead)
def get_order(order_id: int, db: DbSession):
    order = order_service.get_order(db, order_id)
    return order_service.serialize_order_detail(order)


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(order_id: int, db: DbSession):
    order_service.delete_order(db, order_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
