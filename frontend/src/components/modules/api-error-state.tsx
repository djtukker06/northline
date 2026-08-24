import { PlugZap, ServerCrash, ShieldAlert, TimerReset } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";

/**
 * What the user sees when the backend cannot answer.
 *
 * This is the part that only exists once the data is real. With a local mock there
 * is no failure mode, so there is nothing to design. With an API there are several,
 * and they need different words: "the server is down" and "your key expired" are
 * not the same problem and do not have the same fix.
 *
 * The request id is shown on purpose. It is the one piece of information that turns
 * "it was broken" into a log line a backend developer can find in seconds.
 */
export function ApiErrorState({
  error,
  what,
  hint,
  compact = false,
}: {
  error: unknown;
  what: string;
  hint?: string;
  compact?: boolean;
}) {
  const api = error instanceof ApiError ? error : null;

  const { Icon, title, message } = describe(api, what);

  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center text-center",
        compact ? "px-5 py-6" : "px-6 py-12",
      )}
    >
      <span className="bg-critical-soft text-critical mb-3 grid size-10 place-items-center rounded-full">
        <Icon className="size-5" />
      </span>
      <p className={cn("text-ink font-semibold", compact ? "text-small" : "text-body")}>
        {title}
      </p>
      {!compact && (
        <p className="text-ink-2 text-small mt-1 max-w-md">{hint ?? message}</p>
      )}
      {compact && <p className="text-ink-3 text-caption mt-0.5">{what} is unavailable</p>}

      {api?.requestId && (
        <p className="text-ink-3 text-caption mt-3 tabular-nums">
          Reference {api.requestId}
        </p>
      )}
    </div>
  );
}

function describe(api: ApiError | null, what: string) {
  if (!api) {
    return {
      Icon: ServerCrash,
      title: `Could not load ${what}`,
      message: "An unexpected error occurred while rendering this view.",
    };
  }

  switch (api.status) {
    case 0:
      return {
        Icon: PlugZap,
        title: "The API is not reachable",
        message: `${api.message} Start the backend from the project root with: make up`,
      };
    case 401:
      return {
        Icon: ShieldAlert,
        title: "The API rejected this key",
        message:
          "NORTHLINE_API_KEY is missing or no longer valid. Check .env against .env.example.",
      };
    case 429:
      return {
        Icon: TimerReset,
        title: "Too many requests",
        message: "The rate limit was reached. Wait a moment and reload the page.",
      };
    case 503:
      return {
        Icon: ServerCrash,
        title: "The API is not ready",
        message:
          "It is running but a dependency is not. Check the database and Redis with: make ps",
      };
    default:
      return {
        Icon: ServerCrash,
        title: `Could not load ${what}`,
        message: api.message,
      };
  }
}
