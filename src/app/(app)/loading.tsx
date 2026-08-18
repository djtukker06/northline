import { Skeleton } from "@/components/ui/states";

/** Route-level fallback. Mirrors the shape of a page so the shell does not jump. */
export default function Loading() {
  return (
    <div className="mx-auto flex max-w-[112rem] flex-col gap-4 p-4 sm:p-5" aria-busy="true">
      <span className="sr-only">Loading</span>
      <div className="flex items-end justify-between gap-4">
        <div>
          <Skeleton className="h-7 w-56" />
          <Skeleton className="mt-2 h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="bg-surface border-line rounded-panel grid grid-cols-2 overflow-hidden border xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border-line px-5 py-4 [&:not(:first-child)]:border-l">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="mt-3 h-7 w-20" />
            <Skeleton className="mt-3 h-3 w-28" />
          </div>
        ))}
      </div>
      <Skeleton className="h-[26rem] w-full rounded-panel" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Skeleton className="h-64 w-full rounded-panel lg:col-span-2" />
        <Skeleton className="h-64 w-full rounded-panel" />
      </div>
    </div>
  );
}
