# Inventory & Order Management System

A production-ready full-stack inventory and order management system.

- **Frontend**: Next.js 16 (App Router) + React 19 + TypeScript + Tailwind, Server Components + Server Actions, tag-based cache invalidation.
- **Backend**: FastAPI + SQLAlchemy 2.x + Alembic, layered architecture (routes → services → models), transactional order placement with row-level locking.
- **Database**: PostgreSQL 16.
- **Containerized** with Docker + Docker Compose.

## Architecture

```
Browser ─► Next.js (SSR + Server Actions) ─► FastAPI ─► PostgreSQL
```

- Server Components fetch data via tagged `fetch`, enabling on-demand revalidation.
- Server Actions perform all mutations and call `revalidateTag()` so list pages refresh automatically after writes.
- The backend is the single source of truth for validation, totals, and inventory rules. Order creation locks the involved product rows (`SELECT … FOR UPDATE`) inside a single transaction to prevent overselling.

## Running locally with Docker Compose (recommended)

Requirements: Docker 24+ and Docker Compose v2.

```bash
cp .env.example .env
docker compose up --build
```

Then open:

- Frontend: <http://localhost:3000>
- Backend docs (Swagger UI): <http://localhost:8000/docs>
- Backend health: <http://localhost:8000/health>

The backend container runs `alembic upgrade head` on start, so the schema is created automatically.

To tear everything down (and keep data):

```bash
docker compose down
```

To wipe the database volume:

```bash
docker compose down -v
```

## Running locally without Docker

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Point DATABASE_URL at a running Postgres, e.g.:
#   postgresql+psycopg://postgres:postgres@localhost:5432/inventory
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

## API surface

| Method | Path                   | Description                |
|-------:|------------------------|----------------------------|
| GET    | `/products`            | List products              |
| POST   | `/products`            | Create product             |
| GET    | `/products/{id}`       | Get product                |
| PUT    | `/products/{id}`       | Update product             |
| DELETE | `/products/{id}`       | Delete product             |
| GET    | `/customers`           | List customers             |
| POST   | `/customers`           | Create customer            |
| GET    | `/customers/{id}`      | Get customer               |
| DELETE | `/customers/{id}`      | Delete customer            |
| GET    | `/orders`              | List orders                |
| POST   | `/orders`              | Create order (transaction) |
| GET    | `/orders/{id}`         | Get order detail           |
| DELETE | `/orders/{id}`         | Cancel order (restocks)    |
| GET    | `/dashboard`           | Aggregate stats            |
| GET    | `/health`              | Health probe               |

Full schema available in OpenAPI at `/docs`.

## Business rules (enforced by backend)

- SKU is unique (DB unique index + service-level pre-check returning 409).
- Customer email is unique.
- `quantity_in_stock >= 0` (DB check constraint).
- Order placement:
  - Validates customer exists.
  - Locks involved product rows.
  - Rejects insufficient-stock orders with 409.
  - Computes total from the locked product prices.
  - Atomically decrements stock and inserts order + items.
- Order cancellation restores stock atomically.

## Deployment

See [DEPLOYMENT](#deployment-steps) below.

## Test checklist

See [Final test checklist](#final-test-checklist) below.

---

## Deployment steps

### Backend — Render (free tier)

1. Push the repo to GitHub.
2. In Render, create a new **Web Service** from the GitHub repo.
3. Settings:
   - **Root Directory**: `backend`
   - **Runtime**: Docker
   - **Dockerfile path**: `Dockerfile`
   - **Health check path**: `/health`
4. Create a **Render PostgreSQL** instance. Copy the *Internal Database URL*.
5. Add environment variables to the web service:
   - `DATABASE_URL`: paste the Render Postgres URL (the app auto-normalises `postgres://` → `postgresql+psycopg://`).
   - `APP_ENV`: `production`
   - `DEBUG`: `false`
   - `CORS_ORIGINS`: your Vercel frontend URL (e.g. `https://your-app.vercel.app`)
   - `LOW_STOCK_THRESHOLD`: `5`
6. Deploy. The Dockerfile CMD runs `alembic upgrade head` before starting Uvicorn.

(Equivalent setup on Railway/Fly.io: same env vars; provide a managed Postgres URL.)

### Frontend — Vercel

1. Import the GitHub repo in Vercel.
2. Set **Root Directory** to `frontend`.
3. Add environment variables:
   - `API_BASE_URL`: the Render backend URL, e.g. `https://your-backend.onrender.com`
   - `NEXT_PUBLIC_API_BASE_URL`: same URL (only used if any client-side fetch is added later)
4. Deploy. Vercel auto-detects Next.js and uses `next build`.

### Docker Hub (backend image)

```bash
cd backend
docker build -t <your-dockerhub-username>/inventory-backend:1.0.0 .
docker push <your-dockerhub-username>/inventory-backend:1.0.0
```

## Quick frontend smoke tests (manual)

When the stack is running locally via `docker compose up --build`:

- Open the frontend at `http://localhost:3000`.
- From the UI: create a product (`Products → + New product`), create a customer (`Customers → + New customer`), then place an order (`Orders → + New order`).
- Verify that the product stock decrements after an order, and that duplicate SKU / duplicate customer email show error messages.

If you prefer scripted checks, run the provided script which exercises the same flows against the API:

```bash
python3 backend/scripts/api_test.py
```


### Wiring CORS

After both deploys, set `CORS_ORIGINS` on the backend to the Vercel URL and redeploy. Confirm a browser request from the frontend can reach `/dashboard`.

---

## Final test checklist

### Local (docker compose up)

- [ ] `docker compose up --build` exits with no errors; all three services become healthy.
- [ ] `curl http://localhost:8000/health` returns `{"status":"ok"}`.
- [ ] Open <http://localhost:3000> — dashboard renders with all zeros and "All stocked up".
- [ ] Create three products on `/products/new` (try one with `quantity_in_stock=0`).
- [ ] Duplicate SKU returns a 409 with a clear error in the form.
- [ ] Edit a product, change the price and stock — `/products` reflects the change without a hard reload (revalidateTag).
- [ ] Delete a product — confirmation prompt appears; product removed.
- [ ] Create two customers; duplicate email returns 409 with a clear message.
- [ ] Delete a customer — confirmed and removed.
- [ ] Place an order with multiple items. Confirm:
  - [ ] Backend-computed total matches the line-item math.
  - [ ] Product stock decremented by the correct amounts.
  - [ ] Dashboard "Total orders" and "Revenue" updated.
- [ ] Place an order requesting more units than available — 409 "Insufficient stock" surfaced in the form.
- [ ] Delete an order — stock is restored.
- [ ] Try deleting a customer or product that is referenced by an order — 409 with explanation.
- [ ] Mobile viewport (DevTools): navbar collapses to hamburger; tables scroll horizontally.
- [ ] `GET /docs` shows full OpenAPI schema.

### Deployment

- [ ] Frontend Vercel URL loads with no console errors.
- [ ] Backend Render URL `/health` responds 200.
- [ ] CORS allows the frontend domain (no CORS console errors).
- [ ] Creating/updating/deleting works against the deployed backend.
- [ ] `DATABASE_URL` accepted without manual scheme rewriting.
- [ ] Docker Hub backend image pullable with `docker pull <user>/inventory-backend:1.0.0`.

### Optional load/race check

- [ ] In a script, place 5 concurrent orders for the same single-stock product — exactly one succeeds; the others get 409 InsufficientStock (validates `SELECT ... FOR UPDATE`).
