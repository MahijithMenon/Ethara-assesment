"use client";

import { useEffect, useRef } from "react";
import { Button } from "./Button";

export default function ConfirmModal({
  open,
  onConfirm,
  onCancel,
  message,
  confirmLabel = "Confirm",
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  message: string;
  confirmLabel?: string;
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const cancelRef = useRef<HTMLButtonElement | null>(null);
  const titleId = "confirm-modal-title";

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    // focus the cancel button by default
    cancelRef.current?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      } else if (e.key === "Tab") {
        // basic focus trap: keep focus inside the dialog
        const container = dialogRef.current;
        if (!container) return;
        const focusable = container.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div ref={dialogRef} className="relative z-10 w-full max-w-md rounded bg-white p-6 shadow-lg">
        <h3 id={titleId} className="mb-2 text-sm font-semibold text-slate-800">
          Confirm action
        </h3>
        <p className="mb-4 text-sm text-slate-700">{message}</p>
        <div className="flex justify-end gap-2">
          <Button ref={cancelRef as any} variant="secondary" onClick={onCancel} size="sm">
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} size="sm">
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
