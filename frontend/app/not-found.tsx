import Link from "next/link";

import { Container } from "@/components/layout/Container";

export default function NotFound() {
  return (
    <Container>
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">Page not found</h1>
        <p className="mt-2 text-sm text-slate-500">
          The page you requested doesn’t exist.
        </p>
        <Link
          href="/"
          className="mt-4 inline-block rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Back to dashboard
        </Link>
      </div>
    </Container>
  );
}
