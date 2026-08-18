import Link from "next/link";
import { PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="max-w-md text-center">
        <span className="bg-surface-sunken text-ink-3 mx-auto mb-4 grid size-12 place-items-center rounded-full">
          <PackageSearch className="size-6" />
        </span>
        <h1 className="text-ink text-h2 font-semibold">That record does not exist</h1>
        <p className="text-ink-2 text-body mt-2">
          The shipment, vehicle or route you followed is not on the network. It may have been
          archived after delivery.
        </p>
        <div className="mt-5 flex justify-center gap-2">
          <Button variant="secondary" asChild>
            <Link href="/shipments">Browse shipments</Link>
          </Button>
          <Button variant="primary" asChild>
            <Link href="/dashboard">Back to overview</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
