/**
 * Typed API client — the ONLY way feature code talks to the backend
 * (docs/ARCHITECTURE.md §5). Encodes docs/API_CONTRACT.md §2 envelopes:
 * success → resource/collection JSON; failure → ApiRequestError with `code`.
 */

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: unknown;
}

export interface Collection<T> {
  items: T[];
  page: number;
  page_size: number;
  total: number;
}

export class ApiRequestError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details: unknown;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message);
    this.name = "ApiRequestError";
    this.code = body.code;
    this.status = status;
    this.details = body.details ?? null;
  }
}

const BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1").replace(
  /\/$/,
  "",
);

interface ApiOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

function isErrorEnvelope(json: unknown): json is { error: ApiErrorBody } {
  if (typeof json !== "object" || json === null) return false;
  const err = (json as { error?: unknown }).error;
  return (
    typeof err === "object" &&
    err !== null &&
    typeof (err as ApiErrorBody).code === "string" &&
    typeof (err as ApiErrorBody).message === "string"
  );
}

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { body, headers, ...rest } = options;
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...rest,
      credentials: "include",
      headers: { "Content-Type": "application/json", ...(headers ?? {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiRequestError(0, {
      code: "network_unreachable",
      message: "Could not reach the analysis service. Is the backend running?",
    });
  }

  if (res.status === 204) return undefined as T;

  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    // Non-JSON response (proxy/gateway error page, …) — never leak raw HTML.
    throw new ApiRequestError(res.status, {
      code: "bad_response",
      message: "The service returned an unexpected response.",
    });
  }

  if (!res.ok) {
    if (isErrorEnvelope(json)) throw new ApiRequestError(res.status, json.error);
    throw new ApiRequestError(res.status, {
      code: "bad_response",
      message: "The service returned an unexpected response.",
    });
  }
  return json as T;
}

/** Base URL (read-only) — for building links such as API docs. Never fetch directly. */
export function apiBaseUrl(): string {
  return BASE_URL;
}
