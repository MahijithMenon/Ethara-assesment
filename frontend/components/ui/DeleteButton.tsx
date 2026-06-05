"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "./Button";
import ConfirmModal from "./ConfirmModal";
import { useToasts } from "./ToastProvider";

type Props = {
  action: () => Promise<{ ok: boolean; message?: string }>;
  confirmMessage: string;
  label?: string;
  onSuccessRedirect?: string;
  size?: "sm" | "md";
};

export function DeleteButton({
  action,
  confirmMessage,
  label = "Delete",
  onSuccessRedirect,
  size = "sm",
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { addToast } = useToasts();

  function handleConfirm() {
    setError(null);
    setOpen(false);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setError(result.message ?? "Delete failed");
        addToast(result.message ?? "Delete failed", "error");
        return;
      }
      addToast("Deleted", "success");
      if (onSuccessRedirect) {
        router.push(onSuccessRedirect);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="danger"
        size={size}
        onClick={() => setOpen(true)}
        disabled={isPending}
      >
        {isPending ? "Deleting…" : label}
      </Button>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
      <ConfirmModal open={open} onConfirm={handleConfirm} onCancel={() => setOpen(false)} message={confirmMessage} confirmLabel={label} />
    </div>
  );
}
