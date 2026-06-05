import Link from "next/link";
import { notFound } from "next/navigation";

import { Container, PageHeader } from "@/components/layout/Container";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProductForm } from "@/components/forms/ProductForm";
import { ApiClientError, apiFetch } from "@/lib/api";
import { CACHE_TAGS, type Product } from "@/lib/types";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

async function getProduct(id: string): Promise<Product> {
  try {
    return await apiFetch<Product>(`/products/${id}`, {
      tags: [CACHE_TAGS.product(id)],
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
    return { title: `Edit ${product.name}` };
  } catch {
    return { title: "Edit product" };
  }
}

export default async function EditProductPage({ params }: Params) {
  const { id } = await params;
  const product = await getProduct(id);

  return (
    <Container>
      <PageHeader
        title={`Edit ${product.name}`}
        description="Update product details and stock level."
        actions={
          <Link href={`/products/${product.id}`}>
            <Button variant="secondary">Cancel</Button>
          </Link>
        }
      />
      <Card>
        <CardBody>
          <ProductForm product={product} />
        </CardBody>
      </Card>
    </Container>
  );
}
