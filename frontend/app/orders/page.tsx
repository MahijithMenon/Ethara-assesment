import Link from "next/link";

import { Container, PageHeader } from "@/components/layout/Container";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { apiFetch } from "@/lib/api";
import { type OrderSummary } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/format";

export const metadata = { title: "Orders" };

// Orders are money-relevant — always fetch fresh.
export const dynamic = "force-dynamic";

async function getOrders(): Promise<OrderSummary[]> {
  return apiFetch<OrderSummary[]>("/orders", { cache: "no-store" });
}

export default async function OrdersPage() {
  const orders = await getOrders();

  return (
    <Container>
      <PageHeader
        title="Orders"
        description="All orders, most recent first."
        actions={
          <Link href="/orders/new">
            <Button>+ New order</Button>
          </Link>
        }
      />

      {orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          description="Create your first order to start tracking sales."
          action={
            <Link href="/orders/new">
              <Button>+ New order</Button>
            </Link>
          }
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th className="text-right">Items</th>
                  <th className="text-right">Total</th>
                  <th>Status</th>
                  <th>Placed</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <Link
                        href={`/orders/${o.id}`}
                        className="font-mono text-sm font-semibold text-brand-700 hover:underline"
                      >
                        #{o.id}
                      </Link>
                    </td>
                    <td>{o.customer_name}</td>
                    <td className="text-right">{o.item_count}</td>
                    <td className="text-right font-medium">{formatCurrency(o.total_amount)}</td>
                    <td>
                      <Badge tone="info">{o.status}</Badge>
                    </td>
                    <td>{formatDate(o.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </Container>
  );
}
