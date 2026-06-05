"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { ApiClientError, apiFetch } from "../api";
import { type Customer } from "../types";

const customerSchema = z.object({
  full_name: z.string().trim().min(1, "Full name is required").max(255),
  email: z.string().trim().email("Invalid email"),
  phone_number: z.string().trim().min(3, "Phone number too short").max(32),
});

export type CustomerFormState = {
  errors?: Record<string, string[]>;
  message?: string;
  ok?: boolean;
};

function invalidate(customerId?: number) {
  revalidatePath("/customers");
  revalidatePath("/");
  if (customerId !== undefined) revalidatePath(`/customers/${customerId}`);
}

export async function createCustomerAction(
  _prev: CustomerFormState,
  formData: FormData,
): Promise<CustomerFormState> {
  const parsed = customerSchema.safeParse({
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    phone_number: formData.get("phone_number"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  try {
    await apiFetch<Customer>("/customers", { method: "POST", body: parsed.data });
  } catch (err) {
    if (err instanceof ApiClientError) {
      return { message: err.message, ok: false };
    }
    throw err;
  }

  invalidate();
  redirect("/customers");
}

export async function deleteCustomerAction(id: number): Promise<{ ok: boolean; message?: string }> {
  try {
    await apiFetch<void>(`/customers/${id}`, { method: "DELETE" });
  } catch (err) {
    if (err instanceof ApiClientError) {
      return { ok: false, message: err.message };
    }
    throw err;
  }
  invalidate(id);
  return { ok: true };
}
