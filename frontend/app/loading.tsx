import { Container } from "@/components/layout/Container";

export default function Loading() {
  return (
    <Container>
      <div className="animate-pulse space-y-3">
        <div className="h-7 w-48 rounded bg-slate-200" />
        <div className="h-4 w-72 rounded bg-slate-200" />
        <div className="mt-6 h-32 rounded bg-slate-100" />
      </div>
    </Container>
  );
}
