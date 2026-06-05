import Link from "next/link";
import { notFound } from "next/navigation";

import { Container, PageHeader } from "@/components/layout/Container";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { ApiClientError, apiFetch } from "@/lib/api";
import { CACHE_TAGS, type Customer } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { deleteCustomerAction } from "@/lib/actions/customers";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

async function getCustomer(id: string): Promise<Customer> {
  try {
    return await apiFetch<Customer>(`/customers/${id}`, {
      tags: [CACHE_TAGS.customer(id), CACHE_TAGS.customers],
    });
  } catch (err) {
    if (err instanceof ApiClientError && err.status === 404) notFound();
    throw err;
  }
}

export async function generateMetadata({ params }: Params) {
  const { id } = await params;
  try {
    const customer = await getCustomer(id);
    return { title: customer.full_name };
  } catch {
    return { title: "Customer" };
  }
}

export default async function CustomerDetailPage({ params }: Params) {
  const { id } = await params;
  const customer = await getCustomer(id);
  const del = deleteCustomerAction.bind(null, customer.id);

  return (
    <Container>
      <PageHeader
        title={customer.full_name}
        description={customer.email}
        actions={
          <>
            <Link href="/customers">
              <Button variant="secondary">Back</Button>
            </Link>
            <DeleteButton
              action={del}
              confirmMessage={`Delete customer "${customer.full_name}"?`}
              onSuccessRedirect="/customers"
              size="md"
            />
          </>
        }
      />

      <Card>
        <CardBody>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-slate-500">Email</dt>
              <dd className="mt-1 text-sm text-slate-900">{customer.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500">Phone</dt>
              <dd className="mt-1 text-sm text-slate-900">{customer.phone_number}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500">Joined</dt>
              <dd className="mt-1 text-sm text-slate-700">{formatDate(customer.created_at)}</dd>
            </div>
          </dl>
        </CardBody>
      </Card>
    </Container>
  );
}
