import Link from "next/link";

import { Container, PageHeader } from "@/components/layout/Container";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { OrderForm } from "@/components/forms/OrderForm";
import { apiFetch } from "@/lib/api";
import { CACHE_TAGS, type Customer, type Product } from "@/lib/types";

export const metadata = { title: "New order" };

// Fresh stock and customer data on each visit so the form is accurate.
export const dynamic = "force-dynamic";

export default async function NewOrderPage() {
  const [customers, products] = await Promise.all([
    apiFetch<Customer[]>("/customers", { tags: [CACHE_TAGS.customers] }),
    apiFetch<Product[]>("/products", { cache: "no-store" }),
  ]);

  return (
    <Container>
      <PageHeader
        title="New order"
        description="Select a customer and add line items. Backend computes the final total."
        actions={
          <Link href="/orders">
            <Button variant="secondary">Cancel</Button>
          </Link>
        }
      />
      <Card>
        <CardBody>
          <OrderForm customers={customers} products={products} />
        </CardBody>
      </Card>
    </Container>
  );
}
