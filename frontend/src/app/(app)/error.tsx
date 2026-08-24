"use client";

import { useEffect } from "react";
import { ServerCrash } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="max-w-md text-center" role="alert">
        <span className="bg-critical-soft text-critical-text mx-auto mb-4 grid size-12 place-items-center rounded-full">
          <ServerCrash className="size-6" />
        </span>
        <h1 className="text-ink text-h2 font-semibold">This view could not be loaded</h1>
        <p className="text-ink-2 text-body mt-2">
          The operations feed stopped responding while this page was rendering. Nothing on the
          network has changed.
        </p>
        {error.digest && (
          <p className="text-ink-3 text-caption mt-2 tabular-nums">Reference {error.digest}</p>
        )}
        <Button variant="primary" className="mt-5" onClick={reset}>
          Try again
        </Button>
      </div>
    </div>
  );
}
