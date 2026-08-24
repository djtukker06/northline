import { cn } from "@/lib/utils";

/**
 * The NORTHLINE mark: a route climbing north through the counter of an N.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 28 28"
      className={cn("size-7 shrink-0", className)}
      role="img"
      aria-label="NORTHLINE"
    >
      <rect width="28" height="28" rx="7" fill="var(--nl-brand)" />
      <path
        d="M8.6 19.4V8.6l10.8 10.8V8.6"
        fill="none"
        stroke="var(--nl-on-brand)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "text-ink text-[15px] leading-none font-semibold tracking-[0.16em]",
        className,
      )}
    >
      NORTHLINE
    </span>
  );
}
