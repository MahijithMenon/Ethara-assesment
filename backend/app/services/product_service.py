from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, NotFoundError
from app.models.order import OrderItem
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate


def list_products(db: Session) -> List[Product]:
    return list(db.scalars(select(Product).order_by(Product.created_at.desc())).all())


def get_product(db: Session, product_id: int) -> Product:
    product = db.get(Product, product_id)
    if not product:
        raise NotFoundError(f"Product {product_id} not found")
    return product


def _ensure_sku_unique(db: Session, sku: str, exclude_id: Optional[int] = None) -> None:
    stmt = select(Product.id).where(Product.sku == sku)
    if exclude_id is not None:
        stmt = stmt.where(Product.id != exclude_id)
    if db.scalar(stmt) is not None:
        raise ConflictError(f"SKU '{sku}' is already in use", code="sku_conflict")


def create_product(db: Session, data: ProductCreate) -> Product:
    _ensure_sku_unique(db, data.sku)
    product = Product(**data.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def update_product(db: Session, product_id: int, data: ProductUpdate) -> Product:
    product = get_product(db, product_id)
    payload = data.model_dump(exclude_unset=True)

    if "sku" in payload and payload["sku"] != product.sku:
        _ensure_sku_unique(db, payload["sku"], exclude_id=product.id)

    for field, value in payload.items():
        setattr(product, field, value)

    db.commit()
    db.refresh(product)
    return product


def delete_product(db: Session, product_id: int) -> None:
    product = get_product(db, product_id)
    # Prevent deletion of products referenced by orders — keeps order history intact.
    in_use = db.scalar(select(OrderItem.id).where(OrderItem.product_id == product.id).limit(1))
    if in_use is not None:
        raise ConflictError(
            "Cannot delete product that is referenced by existing orders",
            code="product_in_use",
        )
    db.delete(product)
    db.commit()
