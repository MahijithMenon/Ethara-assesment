"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { ApiClientError, apiFetch } from "../api";
import { type Order } from "../types";

const orderSchema = z.object({
  customer_id: z.coerce.number().int().positive("Customer is required"),
  items: z
    .array(
      z.object({
        product_id: z.coerce.number().int().positive(),
        quantity: z.coerce.number().int().positive(),
      }),
    )
    .min(1, "Order must include at least one item"),
});

export type OrderFormState = {
  // Errors are passed through from Zod's flatten() which can be nested;
  // keep this loose to allow `state.errors?.items?.[idx]?.product_id` checks.
  errors?: Record<string, any>;
  message?: string;
  ok?: boolean;
};

function parseItemsFromFormData(formData: FormData) {
  const productIds = formData.getAll("product_id");
  const quantities = formData.getAll("quantity");
  const items: Array<{ product_id: number; quantity: number }> = [];
  for (let i = 0; i < productIds.length; i++) {
    const pid = Number(productIds[i]);
    const qty = Number(quantities[i]);
    if (Number.isFinite(pid) && pid > 0 && Number.isFinite(qty) && qty > 0) {
      items.push({ product_id: pid, quantity: qty });
    }
  }
  return items;
}

function invalidate(orderId?: number) {
  revalidatePath("/orders");
  revalidatePath("/products"); // stock changed
  revalidatePath("/");
  if (orderId !== undefined) revalidatePath(`/orders/${orderId}`);
}

export async function createOrderAction(
  _prev: OrderFormState,
  formData: FormData,
): Promise<OrderFormState> {
  const parsed = orderSchema.safeParse({
    customer_id: formData.get("customer_id"),
    items: parseItemsFromFormData(formData),
  });

  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
      message: "Please correct the highlighted fields",
    };
  }

  let created: Order;
  try {
    created = await apiFetch<Order>("/orders", { method: "POST", body: parsed.data });
  } catch (err) {
    if (err instanceof ApiClientError) {
      return { message: err.message, ok: false };
    }
    throw err;
  }

  invalidate(created.id);
  redirect(`/orders/${created.id}`);
}

export async function deleteOrderAction(id: number): Promise<{ ok: boolean; message?: string }> {
  try {
    await apiFetch<void>(`/orders/${id}`, { method: "DELETE" });
  } catch (err) {
    if (err instanceof ApiClientError) {
      return { ok: false, message: err.message };
    }
    throw err;
  }
  invalidate(id);
  return { ok: true };
}
