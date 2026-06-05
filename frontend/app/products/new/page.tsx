import Link from "next/link";

import { Container, PageHeader } from "@/components/layout/Container";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProductForm } from "@/components/forms/ProductForm";

export const metadata = { title: "New product" };

export default function NewProductPage() {
  return (
    <Container>
      <PageHeader
        title="New product"
        description="Add a product to the catalogue."
        actions={
          <Link href="/products">
            <Button variant="secondary">Cancel</Button>
          </Link>
        }
      />
      <Card>
        <CardBody>
          <ProductForm />
        </CardBody>
      </Card>
    </Container>
  );
}
