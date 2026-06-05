"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/Button";
import { Container } from "@/components/layout/Container";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container>
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <h1 className="text-lg font-semibold text-red-800">Something went wrong</h1>
        <p className="mt-1 text-sm text-red-700">{error.message}</p>
        <div className="mt-4">
          <Button variant="primary" onClick={() => reset()}>
            Try again
          </Button>
        </div>
      </div>
    </Container>
  );
}
