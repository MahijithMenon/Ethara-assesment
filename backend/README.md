# Backend — FastAPI + SQLAlchemy + PostgreSQL

Production-style Python backend for the Inventory & Order Management System.

## Stack

- **FastAPI** (Pydantic v2)
- **SQLAlchemy 2.x** (sync ORM)
- **Alembic** migrations
- **psycopg 3** driver for PostgreSQL
- **PostgreSQL 16**

## Folder structure

```
app/
├── main.py                 FastAPI app factory, CORS, exception handlers, routes
├── config.py               Pydantic settings (env-driven); auto-normalises DB URL schemes
├── database.py             SQLAlchemy engine, session factory, Base
├── core/
│   └── exceptions.py       AppError hierarchy + global handlers → proper HTTP codes
├── models/                 SQLAlchemy ORM models
│   ├── product.py          (unique SKU, non-negative stock & price constraints)
│   ├── customer.py         (unique email)
│   └── order.py            Order + OrderItem (foreign keys, cascade rules)
├── schemas/                Pydantic request/response shapes
│   ├── common.py           ORMModel base (from_attributes=True)
│   ├── product.py
│   ├── customer.py
│   ├── order.py
│   └── dashboard.py
├── services/               Business logic — keeps routes thin
│   ├── product_service.py  CRUD + uniqueness + delete-guard
│   ├── customer_service.py CRUD + uniqueness + delete-guard
│   ├── order_service.py    Transactional create + cancel-with-restock
│   └── dashboard_service.py Aggregate stats + low-stock query
└── api/
    ├── deps.py             DbSession dependency
    └── routes/             Thin route handlers
        ├── products.py
        ├── customers.py
        ├── orders.py
        └── dashboard.py

alembic/
├── env.py                  Uses app.database.Base metadata
├── script.py.mako          Migration template
└── versions/
    └── 0001_initial.py     Initial schema for products, customers, orders, order_items

tests/
└── test_smoke.py           Health endpoint test
```

## Architecture decisions

### Layered architecture

`routes → services → models`. Routes do **nothing** but parse input and call a service.
All business rules (uniqueness checks, stock validation, total calculation) live in
the service layer so they are reusable and testable in isolation.

### Transactional order placement

`order_service.create_order` runs the entire flow inside a single DB transaction:

1. `SELECT … FOR UPDATE` on the involved product rows — blocks concurrent orders for
   the same products until commit/rollback.
2. Verify all products exist and have enough stock; otherwise raise `InsufficientStockError`
   (HTTP 409) and the transaction rolls back, leaving stock untouched.
3. Decrement stock, compute line totals from the locked product prices, insert the
   `orders` row and all `order_items` rows.
4. Commit.

This guarantees that two concurrent buyers of the last unit cannot both succeed.

### Cancellation restocks atomically

`order_service.delete_order` re-locks the same product rows and re-credits the stock,
then deletes the order (`order_items` cascade).

### Authoritative validation

- **DB constraints**: unique SKU, unique email, `quantity_in_stock >= 0`, `price >= 0`,
  `order_items.quantity > 0`, `order_items.unit_price >= 0`.
- **Pydantic schemas**: trim strings, enforce length/format, coerce/validate decimals.
- **Service layer**: catches pre-existing conflicts (returns clean 409) and enforces
  cross-row rules like "cannot delete a product/customer with order history".

### Error model

A single `AppError` base class maps to specific HTTP status codes
(`NotFoundError → 404`, `ConflictError/InsufficientStockError → 409`,
`ValidationError → 422`). The global exception handler returns a uniform shape:

```json
{ "error": { "code": "insufficient_stock", "message": "…" } }
```

Database `IntegrityError` (e.g. a race past the unique pre-check) is caught and
surfaced as 409 without leaking SQL.

### Config

`app/config.py` reads from environment / `.env` via Pydantic settings.

| Variable | Default | Notes |
|---|---|---|
| `DATABASE_URL` | `postgresql+psycopg://postgres:postgres@localhost:5432/inventory` | Auto-normalises `postgres://` and bare `postgresql://` URLs to `postgresql+psycopg://`. Lets Render/Railway/Heroku DSNs be used unchanged. |
| `APP_ENV` | `development` | |
| `DEBUG` | `false` | |
| `CORS_ORIGINS` | `http://localhost:3000` | Comma-separated list |
| `LOW_STOCK_THRESHOLD` | `5` | Used by the dashboard low-stock list |

## API surface

| Method | Path | Description | Codes |
|---|---|---|---|
| GET | `/products` | List | 200 |
| POST | `/products` | Create | 201, 409 (SKU conflict), 422 |
| GET | `/products/{id}` | Get | 200, 404 |
| PUT | `/products/{id}` | Update | 200, 404, 409, 422 |
| DELETE | `/products/{id}` | Delete | 204, 404, 409 (in use) |
| GET | `/customers` | List | 200 |
| POST | `/customers` | Create | 201, 409 (email conflict), 422 |
| GET | `/customers/{id}` | Get | 200, 404 |
| DELETE | `/customers/{id}` | Delete | 204, 404, 409 (in use) |
| GET | `/orders` | List summaries | 200 |
| POST | `/orders` | Create (txn) | 201, 404, 409 (stock), 422 |
| GET | `/orders/{id}` | Detail | 200, 404 |
| DELETE | `/orders/{id}` | Cancel (restocks) | 204, 404 |
| GET | `/dashboard` | Aggregates | 200 |
| GET | `/health` | Health probe | 200 |

Live OpenAPI docs at `/docs` (Swagger) and `/redoc`.

## Local development

### Option A — using docker-compose (recommended)

See the root README. The container runs `alembic upgrade head` before booting Uvicorn.

### Option B — directly on the host

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env so DATABASE_URL points at a running Postgres.
# For a local Postgres on port 5432:
#   DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/inventory

alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

Then open <http://localhost:8000/docs>.

## Migrations

```bash
# Create a new revision after model changes:
alembic revision --autogenerate -m "add foo to bar"

# Apply:
alembic upgrade head

# Roll back one step:
alembic downgrade -1
```

The autogenerate compares against `app.database.Base.metadata`, which imports every
model via `app/models/__init__.py`.

## Tests

```bash
pytest -q
```

The bundled `test_smoke.py` just checks the app boots and `/health` returns 200.
Add integration tests against a disposable Postgres in CI for the real coverage.

## Docker

The multi-stage Dockerfile:

- **Builder**: `python:3.12-slim`, installs system build deps + Python wheels into `/opt/venv`.
- **Runtime**: `python:3.12-slim`, only runtime libs (`libpq5`), non-root user, `HEALTHCHECK`
  hits `/health`. `CMD` runs `alembic upgrade head && uvicorn ...`.

Build standalone:

```bash
docker build -t inventory-backend .
docker run --rm -p 8000:8000 \
  -e DATABASE_URL=postgresql+psycopg://postgres:postgres@host.docker.internal:5432/inventory \
  inventory-backend
```

## Deploy to Render / Railway / Fly.io

1. Connect the GitHub repo and set **Root Directory = `backend`**.
2. Build with the included `Dockerfile`.
3. Provision a managed Postgres; set `DATABASE_URL` on the web service from its DSN.
4. Set `APP_ENV=production`, `DEBUG=false`, and `CORS_ORIGINS=https://<your-vercel-domain>`.
5. Set the health-check path to `/health`.
6. Deploy. Schema migrations run automatically on container start.

## Concurrency verification

To prove the order race is locked correctly:

```bash
# In one terminal:
docker compose up

# In another, create a customer (id 1) and a product (id 1) with stock=1,
# then fire 5 concurrent orders for the last unit:
for i in 1 2 3 4 5; do
  curl -s -X POST http://localhost:8000/orders \
    -H 'Content-Type: application/json' \
    -d '{"customer_id":1,"items":[{"product_id":1,"quantity":1}]}' &
done; wait
```

Expected: exactly one 201, the rest 409 with `code: "insufficient_stock"`.
