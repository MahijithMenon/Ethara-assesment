import Link from "next/link";

import { Container, PageHeader } from "@/components/layout/Container";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { apiFetch } from "@/lib/api";
import { CACHE_TAGS, type Customer } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { deleteCustomerAction } from "@/lib/actions/customers";

export const metadata = { title: "Customers" };

// API isn't reachable at build time → render per-request.
export const dynamic = "force-dynamic";

async function getCustomers(): Promise<Customer[]> {
  return apiFetch<Customer[]>("/customers", { tags: [CACHE_TAGS.customers] });
}

export default async function CustomersPage() {
  const customers = await getCustomers();

  return (
    <Container>
      <PageHeader
        title="Customers"
        description="Manage customer records."
        actions={
          <Link href="/customers/new">
            <Button>+ New customer</Button>
          </Link>
        }
      />

      {customers.length === 0 ? (
        <EmptyState
          title="No customers yet"
          description="Add your first customer to start placing orders."
          action={
            <Link href="/customers/new">
              <Button>+ New customer</Button>
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
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Joined</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => {
                  const del = deleteCustomerAction.bind(null, c.id);
                  return (
                    <tr key={c.id}>
                      <td className="font-medium">
                        <Link
                          href={`/customers/${c.id}`}
                          className="text-slate-900 hover:text-brand-700"
                        >
                          {c.full_name}
                        </Link>
                      </td>
                      <td>{c.email}</td>
                      <td>{c.phone_number}</td>
                      <td>{formatDate(c.created_at)}</td>
                      <td className="text-right">
                        <DeleteButton
                          action={del}
                          confirmMessage={`Delete customer "${c.full_name}"?`}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </Container>
  );
}
