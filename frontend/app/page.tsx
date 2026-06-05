import Link from "next/link";

import { Container, PageHeader } from "@/components/layout/Container";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { apiFetch } from "@/lib/api";
import { CACHE_TAGS, type DashboardStats } from "@/lib/types";
import { formatCurrency } from "@/lib/format";

export const metadata = { title: "Dashboard" };

// Render per-request: the API is not reachable at build time. The underlying
// fetch is still cached for 30s, so repeat visits within that window are cheap.
export const dynamic = "force-dynamic";

async function getStats(): Promise<DashboardStats> {
  return apiFetch<DashboardStats>("/dashboard", {
    tags: [CACHE_TAGS.dashboard],
    revalidate: 30,
  });
}

function Stat({
  label,
  value,
  href,
}: {
  label: string;
  value: string | number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-300 hover:shadow"
    >
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 group-hover:text-brand-700">
        {value}
      </p>
    </Link>
  );
}

export default async function DashboardPage() {
  const stats = await getStats();

  return (
    <Container>
      <PageHeader
        title="Dashboard"
        description="Overview of products, customers and orders."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total products" value={stats.total_products} href="/products" />
        <Stat label="Total customers" value={stats.total_customers} href="/customers" />
        <Stat label="Total orders" value={stats.total_orders} href="/orders" />
        <Stat label="Revenue" value={formatCurrency(stats.revenue)} href="/orders" />
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader
            title="Low stock"
            description={`Products at or below ${stats.low_stock_threshold} units.`}
          />
          <CardBody>
            {stats.low_stock_products.length === 0 ? (
              <EmptyState
                title="All stocked up"
                description="No products are currently below the low-stock threshold."
              />
            ) : (
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>SKU</th>
                    <th className="text-right">Stock</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {stats.low_stock_products.map((p) => (
                    <tr key={p.id}>
                      <td className="font-medium">{p.name}</td>
                      <td className="font-mono text-xs">{p.sku}</td>
                      <td className="text-right">
                        <Badge tone={p.quantity_in_stock === 0 ? "danger" : "warning"}>
                          {p.quantity_in_stock}
                        </Badge>
                      </td>
                      <td className="text-right">
                        <Link
                          href={`/products/${p.id}`}
                          className="text-sm font-medium text-brand-700 hover:underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardBody>
        </Card>
      </div>
    </Container>
  );
}
