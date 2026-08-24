import "server-only";

/**
 * The API client.
 *
 * `import "server-only"` makes the build fail if any of this is ever imported into
 * a Client Component. That guard is deliberate: the API key lives in this module,
 * and anything that reaches the browser bundle is public. Server Components,
 * Route Handlers and Server Actions may use it; a "use client" file may not.
 *
 * This is the pattern to insist on when a backend developer hands you a key.
 * NEXT_PUBLIC_ prefixed variables are inlined into the browser bundle by Next.js;
 * these are not prefixed, so they stay on the server.
 */

const BASE_URL = process.env.NORTHLINE_API_URL ?? "http://localhost:8080/api/v1";
const API_KEY = process.env.NORTHLINE_API_KEY ?? "";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    /** Ties this failure to a line in the API's own logs. */
    readonly requestId?: string,
    readonly details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiError";
  }

  /** A 5xx or a network fault may succeed on a second attempt; a 4xx will not. */
  get isRetryable(): boolean {
    return this.status >= 500 || this.status === 0 || this.status === 429;
  }
}

export interface Paginated<T> {
  data: T[];
  meta: {
    current_page: number;
    from: number | null;
    last_page: number;
    per_page: number;
    to: number | null;
    total: number;
  };
}

type Params = Record<string, string | number | boolean | undefined | null>;

interface FetchOptions {
  /**
   * Seconds Next.js may serve this response from its own cache before fetching
   * again. This is a third cache layer, on top of Redis in the API and
   * Cache-Control in the browser, and it is the one that decides how fresh the
   * rendered page is.
   */
  revalidate?: number;
  /** Cache tags, so a mutation can invalidate exactly what it changed. */
  tags?: string[];
  signal?: AbortSignal;
}

function buildUrl(path: string, params?: Params): string {
  const url = new URL(`${BASE_URL.replace(/\/$/, "")}/${path.replace(/^\//, "")}`);

  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

/**
 * One place where every request is made, so timeouts, retries, auth and error
 * shape are handled once rather than at seventy call sites.
 */
export async function apiFetch<T>(
  path: string,
  params?: Params,
  options: FetchOptions = {},
): Promise<T> {
  const url = buildUrl(path, params);

  // Without a timeout a hung backend hangs the page render indefinitely. Ten
  // seconds is generous for this API and still far below any sensible page budget.
  const timeout = AbortSignal.timeout(10_000);
  const signal = options.signal
    ? AbortSignal.any([options.signal, timeout])
    : timeout;

  let response: Response;

  try {
    response = await fetch(url, {
      headers: {
        "X-API-Key": API_KEY,
        Accept: "application/json",
      },
      signal,
      next: {
        revalidate: options.revalidate ?? 30,
        tags: options.tags,
      },
    });
  } catch (cause) {
    // DNS failure, connection refused, timeout: the request never reached the API.
    throw new ApiError(
      0,
      "network_error",
      cause instanceof Error && cause.name === "TimeoutError"
        ? "The API did not respond within 10 seconds."
        : "The connection was refused.",
    );
  }

  if (!response.ok) {
    let code = "http_error";
    let message = `The API answered ${response.status}.`;
    let details: Record<string, string[]> | undefined;

    try {
      const body = await response.json();
      code = body?.error?.code ?? code;
      message = body?.error?.message ?? message;
      details = body?.error?.details;
    } catch {
      // A non-JSON error body means something upstream failed before the
      // application ran, such as nginx returning its own 502 page.
    }

    throw new ApiError(
      response.status,
      code,
      message,
      response.headers.get("X-Request-Id") ?? undefined,
      details,
    );
  }

  return (await response.json()) as T;
}

/** Unwraps the `{ data: ... }` envelope every endpoint returns. */
export async function apiGet<T>(
  path: string,
  params?: Params,
  options?: FetchOptions,
): Promise<T> {
  const body = await apiFetch<{ data: T }>(path, params, options);
  return body.data;
}

/** Keeps the pagination envelope, for list views that show totals. */
export async function apiList<T>(
  path: string,
  params?: Params,
  options?: FetchOptions,
): Promise<Paginated<T>> {
  return apiFetch<Paginated<T>>(path, params, options);
}
