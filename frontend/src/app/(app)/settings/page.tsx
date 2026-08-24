import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/panel";
import { SettingsForm } from "@/components/modules/settings-form";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4 p-4 sm:p-5">
      <PageHeader
        title="Settings"
        description="Workspace defaults and the thresholds that drive alerting."
      />
      <SettingsForm />
    </div>
  );
}
