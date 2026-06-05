"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/Button";
import { createOrderAction, type OrderFormState } from "@/lib/actions/orders";
import { formatCurrency } from "@/lib/format";
import type { Customer, Product } from "@/lib/types";

const initial: OrderFormState = {};

type LineItem = {
  product_id: string;
  quantity: string;
};

function SubmitButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled}>
      {pending ? "Placing order…" : "Place order"}
    </Button>
  );
}

export function OrderForm({
  customers,
  products,
}: {
  customers: Customer[];
  products: Product[];
}) {
  const [state, formAction] = useActionState(createOrderAction, initial);

  const inStockProducts = useMemo(
    () => products.filter((p) => p.quantity_in_stock > 0),
    [products],
  );

  const [items, setItems] = useState<LineItem[]>(
    inStockProducts.length > 0
      ? [{ product_id: String(inStockProducts[0].id), quantity: "1" }]
      : [],
  );

  const productsById = useMemo(() => {
    const map = new Map<number, Product>();
    products.forEach((p) => map.set(p.id, p));
    return map;
  }, [products]);

  function addRow() {
    if (inStockProducts.length === 0) return;
    setItems((prev) => [
      ...prev,
      { product_id: String(inStockProducts[0].id), quantity: "1" },
    ]);
  }

  function removeRow(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateRow(index: number, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  const previewTotal = items.reduce((sum, row) => {
    const product = productsById.get(Number(row.product_id));
    const qty = Number(row.quantity);
    if (!product || !Number.isFinite(qty) || qty <= 0) return sum;
    return sum + parseFloat(product.price) * qty;
  }, 0);

  const hasRows = items.length > 0;
  const noCustomers = customers.length === 0;
  const noProducts = inStockProducts.length === 0;
  const disabled = noCustomers || noProducts || !hasRows;

  return (
    <form action={formAction} className="space-y-5">
      {state.message ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {state.message}
        </div>
      ) : null}

      {noCustomers ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          No customers yet — create one before placing an order.
        </div>
      ) : null}
      {noProducts ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          No products in stock — add stocked products before placing an order.
        </div>
      ) : null}

      <div>
        <label className="label-base" htmlFor="customer_id">
          Customer
        </label>
        <select
          id="customer_id"
          name="customer_id"
          required
          defaultValue=""
          className="input-base"
          disabled={noCustomers}
          aria-invalid={state.errors?.customer_id ? true : undefined}
        >
          <option value="" disabled>
            Select a customer…
          </option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.full_name} ({c.email})
            </option>
          ))}
        </select>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="label-base mb-0">Items</span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={addRow}
            disabled={noProducts}
          >
            + Add item
          </Button>
        </div>

        <div className="space-y-2">
          {items.map((row, idx) => {
            const product = productsById.get(Number(row.product_id));
            const maxQty = product?.quantity_in_stock ?? 0;
            return (
              <div
                key={idx}
                className="grid grid-cols-1 items-end gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[1fr_120px_auto]"
              >
                <div>
                  <label className="label-base text-xs">Product</label>
                  <select
                    name="product_id"
                    required
                    value={row.product_id}
                    onChange={(e) => updateRow(idx, { product_id: e.target.value })}
                    className="input-base"
                    aria-invalid={state.errors?.items?.[idx]?.product_id ? true : undefined}
                  >
                    {inStockProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {formatCurrency(p.price)} ({p.quantity_in_stock} in stock)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label-base text-xs">Quantity</label>
                  <input
                    name="quantity"
                    type="number"
                    min={1}
                    max={maxQty || undefined}
                    required
                    value={row.quantity}
                    onChange={(e) => updateRow(idx, { quantity: e.target.value })}
                    className="input-base"
                    aria-invalid={state.errors?.items?.[idx]?.quantity ? true : undefined}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeRow(idx)}
                  disabled={items.length === 1}
                >
                  Remove
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-md bg-slate-100 px-4 py-3">
        <span className="text-sm font-medium text-slate-700">Estimated total</span>
        <span className="text-lg font-semibold text-slate-900">
          {formatCurrency(previewTotal)}
        </span>
      </div>
      <p className="text-xs text-slate-500">
        The final total is calculated by the backend at the moment the order is placed.
      </p>

      <div className="flex justify-end">
        <SubmitButton disabled={disabled} />
      </div>
    </form>
  );
}
