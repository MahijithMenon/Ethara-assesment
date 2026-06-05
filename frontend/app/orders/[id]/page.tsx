import Link from "next/link";
import { notFound } from "next/navigation";

import { Container, PageHeader } from "@/components/layout/Container";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { ApiClientError, apiFetch } from "@/lib/api";
import { CACHE_TAGS, type Order } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/format";
import { deleteOrderAction } from "@/lib/actions/orders";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

async function getOrder(id: string): Promise<Order> {
  try {
    return await apiFetch<Order>(`/orders/${id}`, {
      tags: [CACHE_TAGS.order(id), CACHE_TAGS.orders],
    });
  } catch (err) {
    if (err instanceof ApiClientError && err.status === 404) notFound();
    throw err;
  }
}

export async function generateMetadata({ params }: Params) {
  const { id } = await params;
  return { title: `Order #${id}` };
}

export default async function OrderDetailPage({ params }: Params) {
  const { id } = await params;
  const order = await getOrder(id);
  const cancel = deleteOrderAction.bind(null, order.id);

  return (
    <Container>
      <PageHeader
        title={`Order #${order.id}`}
        description={`Placed ${formatDate(order.created_at)}`}
        actions={
          <>
            <Link href="/orders">
              <Button variant="secondary">Back</Button>
            </Link>
            <DeleteButton
              action={cancel}
              confirmMessage={`Cancel order #${order.id}? Stock will be restored to inventory.`}
              label="Cancel order"
              onSuccessRedirect="/orders"
              size="md"
            />
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader title="Customer" />
          <CardBody>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-slate-500">Name</dt>
                <dd className="font-medium text-slate-900">
                  <Link
                    href={`/customers/${order.customer.id}`}
                    className="hover:text-brand-700"
                  >
                    {order.customer.full_name}
                  </Link>
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Email</dt>
                <dd className="text-slate-900">{order.customer.email}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Phone</dt>
                <dd className="text-slate-900">{order.customer.phone_number}</dd>
              </div>
              <div className="pt-2">
                <dt className="text-slate-500">Status</dt>
                <dd className="mt-1">
                  <Badge tone="info">{order.status}</Badge>
                </dd>
              </div>
            </dl>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Items" />
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th className="text-right">Qty</th>
                    <th className="text-right">Unit price</th>
                    <th className="text-right">Line total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td className="font-medium text-slate-900">{item.product_name}</td>
                      <td className="font-mono text-xs">{item.product_sku}</td>
                      <td className="text-right">{item.quantity}</td>
                      <td className="text-right">{formatCurrency(item.unit_price)}</td>
                      <td className="text-right font-medium">
                        {formatCurrency(item.line_total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={4} className="text-right font-semibold text-slate-700">
                      Total
                    </td>
                    <td className="text-right text-lg font-semibold text-slate-900">
                      {formatCurrency(order.total_amount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardBody>
        </Card>
      </div>
    </Container>
  );
}
