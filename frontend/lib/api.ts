import type { ApiError } from "./types";

const API_BASE_URL =
  process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export class ApiClientError extends Error {
  status: number;
  code: string;
  constructor(message: string, status: number, code: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

type FetchOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  tags?: string[];
  revalidate?: number | false;
  cache?: RequestCache;
};

/**
 * Centralised fetch wrapper used by all Server Components and Server Actions.
 * - `tags` groups cached fetch entries (useful for future use-cache integration).
 * - `revalidate` sets time-based revalidation. Pass `false` to disable caching.
 * - Path-based invalidation happens in Server Actions via `revalidatePath`.
 */
export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { method = "GET", body, tags, revalidate, cache } = options;

  const init: RequestInit & { next?: { tags?: string[]; revalidate?: number | false } } = {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  };

  if (body !== undefined) {
    init.body = JSON.stringify(body);
  }

  if (cache) {
    init.cache = cache;
  } else if (method === "GET") {
    init.next = {};
    if (tags) init.next.tags = tags;
    if (revalidate !== undefined) init.next.revalidate = revalidate;
  } else {
    // Mutations should never be cached.
    init.cache = "no-store";
  }

  const url = `${API_BASE_URL}${path}`;
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (err) {
    throw new ApiClientError(
      `Network error contacting API: ${(err as Error).message}`,
      0,
      "network_error",
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const apiErr = data as ApiError | null;
    const message = apiErr?.error?.message ?? `Request failed with status ${response.status}`;
    const code = apiErr?.error?.code ?? "http_error";
    throw new ApiClientError(message, response.status, code);
  }

  return data as T;
}
