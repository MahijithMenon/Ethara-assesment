import Link from "next/link";

import { Container, PageHeader } from "@/components/layout/Container";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CustomerForm } from "@/components/forms/CustomerForm";

export const metadata = { title: "New customer" };

export default function NewCustomerPage() {
  return (
    <Container>
      <PageHeader
        title="New customer"
        description="Add a customer to your records."
        actions={
          <Link href="/customers">
            <Button variant="secondary">Cancel</Button>
          </Link>
        }
      />
      <Card>
        <CardBody>
          <CustomerForm />
        </CardBody>
      </Card>
    </Container>
  );
}
