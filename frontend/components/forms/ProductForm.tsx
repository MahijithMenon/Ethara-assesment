"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/Button";
import {
  createProductAction,
  updateProductAction,
  type ProductFormState,
} from "@/lib/actions/products";
import type { Product } from "@/lib/types";

const initial: ProductFormState = {};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : label}
    </Button>
  );
}

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="mt-1 text-xs text-red-600">{messages[0]}</p>;
}

export function ProductForm({ product }: { product?: Product }) {
  const isEdit = !!product;
  const boundAction = isEdit
    ? updateProductAction.bind(null, product!.id)
    : createProductAction;

  const [state, formAction] = useActionState(boundAction, initial);

  return (
    <form action={formAction} className="space-y-4">
      {state.message ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {state.message}
        </div>
      ) : null}

      <div>
        <label className="label-base" htmlFor="name">
          Product name
        </label>
        <input
          id="name"
          name="name"
          required
          maxLength={255}
          defaultValue={product?.name ?? ""}
          className="input-base"
          aria-invalid={state.errors?.name ? true : undefined}
        />
        <FieldError messages={state.errors?.name} />
      </div>

      <div>
        <label className="label-base" htmlFor="sku">
          SKU / code
        </label>
        <input
          id="sku"
          name="sku"
          required
          maxLength={64}
          defaultValue={product?.sku ?? ""}
          className="input-base"
          aria-invalid={state.errors?.sku ? true : undefined}
        />
        <FieldError messages={state.errors?.sku} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label-base" htmlFor="price">
            Price (USD)
          </label>
          <input
            id="price"
            name="price"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={product?.price ?? ""}
            className="input-base"
            aria-invalid={state.errors?.price ? true : undefined}
          />
          <FieldError messages={state.errors?.price} />
        </div>
        <div>
          <label className="label-base" htmlFor="quantity_in_stock">
            Quantity in stock
          </label>
          <input
            id="quantity_in_stock"
            name="quantity_in_stock"
            type="number"
            min="0"
            step="1"
            required
            defaultValue={product?.quantity_in_stock ?? 0}
            className="input-base"
            aria-invalid={state.errors?.quantity_in_stock ? true : undefined}
          />
          <FieldError messages={state.errors?.quantity_in_stock} />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <SubmitButton label={isEdit ? "Update product" : "Create product"} />
      </div>
    </form>
  );
}
