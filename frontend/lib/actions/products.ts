"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { ApiClientError, apiFetch } from "../api";
import { type Product } from "../types";

const productSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(255),
  sku: z.string().trim().min(1, "SKU is required").max(64),
  price: z.coerce.number().min(0, "Price must be non-negative"),
  quantity_in_stock: z.coerce.number().int().min(0, "Quantity must be non-negative"),
});

export type ProductFormState = {
  errors?: Record<string, string[]>;
  message?: string;
  ok?: boolean;
};

function invalidate(productId?: number) {
  revalidatePath("/products");
  revalidatePath("/");
  if (productId !== undefined) revalidatePath(`/products/${productId}`);
}

export async function createProductAction(
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    sku: formData.get("sku"),
    price: formData.get("price"),
    quantity_in_stock: formData.get("quantity_in_stock"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  try {
    await apiFetch<Product>("/products", { method: "POST", body: parsed.data });
  } catch (err) {
    if (err instanceof ApiClientError) {
      return { message: err.message, ok: false };
    }
    throw err;
  }

  invalidate();
  redirect("/products");
}

export async function updateProductAction(
  id: number,
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    sku: formData.get("sku"),
    price: formData.get("price"),
    quantity_in_stock: formData.get("quantity_in_stock"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  try {
    await apiFetch<Product>(`/products/${id}`, { method: "PUT", body: parsed.data });
  } catch (err) {
    if (err instanceof ApiClientError) {
      return { message: err.message, ok: false };
    }
    throw err;
  }

  invalidate(id);
  redirect(`/products/${id}`);
}

export async function deleteProductAction(id: number): Promise<{ ok: boolean; message?: string }> {
  try {
    await apiFetch<void>(`/products/${id}`, { method: "DELETE" });
  } catch (err) {
    if (err instanceof ApiClientError) {
      return { ok: false, message: err.message };
    }
    throw err;
  }
  invalidate(id);
  return { ok: true };
}
