import Link from "next/link";
import { notFound } from "next/navigation";

import { Container, PageHeader } from "@/components/layout/Container";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { ApiClientError, apiFetch } from "@/lib/api";
import { CACHE_TAGS, type Product } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/format";
import { deleteProductAction } from "@/lib/actions/products";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

async function getProduct(id: string): Promise<Product> {
  try {
    return await apiFetch<Product>(`/products/${id}`, {
      tags: [CACHE_TAGS.product(id), CACHE_TAGS.products],
    });
  } catch (err) {
    if (err instanceof ApiClientError && err.status === 404) notFound();
    throw err;
  }
}

export async function generateMetadata({ params }: Params) {
  const { id } = await params;
  try {
    const product = await getProduct(id);
    return { title: product.name };
  } catch {
    return { title: "Product" };
  }
}

export default async function ProductDetailPage({ params }: Params) {
  const { id } = await params;
  const product = await getProduct(id);
  const deleteThis = deleteProductAction.bind(null, product.id);

  return (
    <Container>
      <PageHeader
        title={product.name}
        description={`SKU ${product.sku}`}
        actions={
          <>
            <Link href={`/products/${product.id}/edit`}>
              <Button variant="secondary">Edit</Button>
            </Link>
            <DeleteButton
              action={deleteThis}
              confirmMessage={`Delete "${product.name}"? This cannot be undone.`}
              onSuccessRedirect="/products"
              size="md"
            />
          </>
        }
      />

      <Card>
        <CardBody>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-slate-500">Price</dt>
              <dd className="mt-1 text-base text-slate-900">
                {formatCurrency(product.price)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500">Stock</dt>
              <dd className="mt-1">
                <Badge
                  tone={
                    product.quantity_in_stock === 0
                      ? "danger"
                      : product.quantity_in_stock <= 5
                        ? "warning"
                        : "success"
                  }
                >
                  {product.quantity_in_stock} units
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500">Created</dt>
              <dd className="mt-1 text-sm text-slate-700">
                {formatDate(product.created_at)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500">Last updated</dt>
              <dd className="mt-1 text-sm text-slate-700">
                {formatDate(product.updated_at)}
              </dd>
            </div>
          </dl>
        </CardBody>
      </Card>
    </Container>
  );
}
