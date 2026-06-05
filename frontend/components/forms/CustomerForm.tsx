"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/Button";
import {
  createCustomerAction,
  type CustomerFormState,
} from "@/lib/actions/customers";

const initial: CustomerFormState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Create customer"}
    </Button>
  );
}

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="mt-1 text-xs text-red-600">{messages[0]}</p>;
}

export function CustomerForm() {
  const [state, formAction] = useActionState(createCustomerAction, initial);

  return (
    <form action={formAction} className="space-y-4">
      {state.message ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {state.message}
        </div>
      ) : null}

      <div>
        <label className="label-base" htmlFor="full_name">
          Full name
        </label>
        <input
          id="full_name"
          name="full_name"
          required
          maxLength={255}
          className="input-base"
          aria-invalid={state.errors?.full_name ? true : undefined}
        />
        <FieldError messages={state.errors?.full_name} />
      </div>

      <div>
        <label className="label-base" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="input-base"
          aria-invalid={state.errors?.email ? true : undefined}
        />
        <FieldError messages={state.errors?.email} />
      </div>

      <div>
        <label className="label-base" htmlFor="phone_number">
          Phone number
        </label>
        <input
          id="phone_number"
          name="phone_number"
          required
          maxLength={32}
          className="input-base"
          aria-invalid={state.errors?.phone_number ? true : undefined}
        />
        <FieldError messages={state.errors?.phone_number} />
      </div>

      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
