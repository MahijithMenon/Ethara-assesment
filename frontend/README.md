# Frontend — Next.js 16 (App Router)

Type-safe, SSR-first frontend for the Inventory & Order Management System.

## Stack

- **Next.js 16** (App Router, React Server Components)
- **React 19** (`useActionState`, async `params`)
- **TypeScript** strict mode
- **Tailwind CSS 3** for styling
- **Zod** for Server Action input validation
- **Server Actions** for every mutation
- Tag-based cache invalidation (`revalidateTag`)

## Folder structure

```
app/
├── layout.tsx              Root layout (Navbar, metadata, viewport)
├── page.tsx                Dashboard — revalidate every 30s, tag "dashboard"
├── loading.tsx             Skeleton shown during streaming
├── error.tsx               Global error boundary
├── not-found.tsx           404 page
├── globals.css             Tailwind + component classes
├── products/
│   ├── page.tsx            List (cached, tag "products")
│   ├── new/page.tsx        Create form
│   └── [id]/
│       ├── page.tsx        Detail (tag "product-<id>")
│       └── edit/page.tsx   Edit form
├── customers/
│   ├── page.tsx            List
│   ├── new/page.tsx        Create form
│   └── [id]/page.tsx       Detail
└── orders/
    ├── page.tsx            List (force-dynamic — money-relevant)
    ├── new/page.tsx        Create form
    └── [id]/page.tsx       Detail

components/
├── layout/                 Navbar, Container, PageHeader
├── ui/                     Button, Card, Badge, EmptyState, DeleteButton
└── forms/                  ProductForm, CustomerForm, OrderForm  (Client Components)

lib/
├── api.ts                  Typed fetch wrapper (cache tags + revalidate)
├── types.ts                Shared TS types + CACHE_TAGS registry
├── format.ts               Currency / date formatters
└── actions/
    ├── products.ts         Server Actions for product CRUD
    ├── customers.ts        Server Actions for customer CRUD
    └── orders.ts           Server Actions for order create / cancel
```

## Rendering & caching strategy

The default `fetch` cache in Next.js 16 is **`no-store`** (uncached). Caching is opt-in
via `next.tags` or `next.revalidate` — all done through the `apiFetch` helper.

| Route | Strategy | Why |
|---|---|---|
| `/` (Dashboard) | `revalidate = 30` + tag `dashboard` | Cheap, fresh-enough; invalidated on every mutation |
| `/products` | tag `products` | Stable until a product mutation invalidates the tag |
| `/products/[id]` | tags `product-<id>`, `products` | Granular invalidation per product |
| `/customers` | tag `customers` | Same pattern |
| `/orders` | `force-dynamic` (`cache: 'no-store'`) | Money-relevant; never cached |
| `/orders/new` | `force-dynamic` | Always show real-time stock |
| `/orders/[id]` | tags `order-<id>`, `orders` | Cancellable orders revalidate via tag |

After every mutation in `lib/actions/*`, the relevant tags are passed to
`revalidateTag()` so that the next page render fetches fresh data.

## Server Actions

All mutations go through Server Actions (`"use server"` directives in `lib/actions/`).
The flow is:

1. Form submits to `formAction` returned by `useActionState`.
2. Server Action validates input with Zod, returns `{ errors }` on failure.
3. On success, calls FastAPI, then `revalidateTag()`, then `redirect()`.
4. Backend remains the single source of truth for validation/business rules.

## Environment variables

Copy `.env.example` to `.env.local` (or set in Vercel project settings):

| Variable | Purpose |
|---|---|
| `API_BASE_URL` | URL the Next.js **server** uses to call FastAPI. In compose: `http://backend:8000`. In Vercel: your Render/Railway URL. |
| `NEXT_PUBLIC_API_BASE_URL` | Public URL used by any client-side fetches (currently unused, included for future extensions). |

## Local development

```bash
cp .env.example .env.local
npm install
npm run dev          # starts on http://localhost:3000
```

For production-like preview:

```bash
npm run build
npm start
```

## Build output

The frontend builds with `output: "standalone"` so the production image only
ships the minimal Node server, tree-shaken `node_modules`, and the build
artefacts. This keeps the Docker image small (~150 MB).

## Type checking

```bash
npm run type-check
```

## Notable Next.js 16 details applied here

- `useActionState` is imported from `react` (not `react-dom`).
- Dynamic route segments use `params: Promise<{ id: string }>` and are awaited.
- `experimental.serverActions` is no longer needed — Server Actions are stable.
- Server Components are the default; only forms and the navbar are `"use client"`.
- Caching is **explicit**: every cached fetch sets `tags` or `revalidate`.

## Deploying to Vercel

1. Import the repo with **Root Directory = `frontend`**.
2. Set `API_BASE_URL` and `NEXT_PUBLIC_API_BASE_URL` to your deployed backend URL.
3. Deploy. No build command override is needed; Vercel auto-detects Next.js 16.

## Deploying via Docker

```bash
docker build -t inventory-frontend .
docker run --rm -p 3000:3000 \
  -e API_BASE_URL=http://host.docker.internal:8000 \
  inventory-frontend
```

In `docker-compose.yml` the frontend is wired to `http://backend:8000` over the
internal docker network — see the root README for the full compose flow.
