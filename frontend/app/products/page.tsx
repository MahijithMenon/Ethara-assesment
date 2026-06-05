import Link from "next/link";

import { Container, PageHeader } from "@/components/layout/Container";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { apiFetch } from "@/lib/api";
import { CACHE_TAGS, type Product } from "@/lib/types";
import { formatCurrency } from "@/lib/format";

export const metadata = { title: "Products" };

// API isn't reachable at build time → render per-request.
export const dynamic = "force-dynamic";

async function getProducts(): Promise<Product[]> {
  return apiFetch<Product[]>("/products", {
    tags: [CACHE_TAGS.products],
  });
}

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <Container>
      <PageHeader
        title="Products"
        description="Manage your catalogue and stock levels."
        actions={
          <Link href="/products/new">
            <Button>+ New product</Button>
          </Link>
        }
      />

      {products.length === 0 ? (
        <EmptyState
          title="No products yet"
          description="Add your first product to start tracking inventory."
          action={
            <Link href="/products/new">
              <Button>+ New product</Button>
            </Link>
          }
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>SKU</th>
                  <th className="text-right">Price</th>
                  <th className="text-right">Stock</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td className="font-medium">
                      <Link
                        href={`/products/${p.id}`}
                        className="text-slate-900 hover:text-brand-700"
                      >
                        {p.name}
                      </Link>
                    </td>
                    <td className="font-mono text-xs">{p.sku}</td>
                    <td className="text-right">{formatCurrency(p.price)}</td>
                    <td className="text-right">
                      <Badge
                        tone={
                          p.quantity_in_stock === 0
                            ? "danger"
                            : p.quantity_in_stock <= 5
                              ? "warning"
                              : "success"
                        }
                      >
                        {p.quantity_in_stock}
                      </Badge>
                    </td>
                    <td className="text-right">
                      <Link
                        href={`/products/${p.id}/edit`}
                        className="text-sm font-medium text-brand-700 hover:underline"
                      >
                        Edit
                      </Link>
                    </td>
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
