"use client";

import * as React from "react";
import * as Switch from "@radix-ui/react-switch";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Input, FieldLabel } from "@/components/ui/input";
import { FilterMenu } from "@/components/ui/dropdown";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function Toggle({
  id,
  label,
  hint,
  defaultChecked,
}: {
  id: string;
  label: string;
  hint: string;
  defaultChecked?: boolean;
}) {
  const [on, setOn] = React.useState(Boolean(defaultChecked));
  return (
    <div className="border-line flex items-start justify-between gap-6 border-b py-3.5 last:border-b-0">
      <div className="min-w-0">
        <label htmlFor={id} className="text-ink text-small font-medium">
          {label}
        </label>
        <p className="text-ink-2 text-caption mt-0.5">{hint}</p>
      </div>
      <Switch.Root
        id={id}
        checked={on}
        onCheckedChange={setOn}
        className={cn(
          "relative h-5 w-9 shrink-0 rounded-full transition-colors",
          on ? "bg-brand" : "bg-line-strong",
        )}
      >
        <Switch.Thumb className="block size-4 translate-x-0.5 rounded-full bg-white shadow-sm transition-transform data-[state=checked]:translate-x-[1.125rem]" />
      </Switch.Root>
    </div>
  );
}

export function SettingsForm() {
  const [units, setUnits] = React.useState<"metric" | "imperial">("metric");
  const [timezone, setTimezone] = React.useState("Europe/Amsterdam");
  const [firstDay, setFirstDay] = React.useState("monday");
  const [saved, setSaved] = React.useState(false);

  return (
    <>
      <Panel>
        <PanelHeader
          title="Workspace"
          description="Applies to everyone in the Northline Freight workspace"
        />
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 px-5 py-4 md:grid-cols-2">
          <div>
            <FieldLabel htmlFor="org">Organisation name</FieldLabel>
            <Input id="org" defaultValue="Northline Freight" />
          </div>
          <div>
            <FieldLabel htmlFor="ref" hint="Prefix for new consignments">
              Shipment reference format
            </FieldLabel>
            <Input id="ref" defaultValue="NL-#####" />
          </div>
          <div>
            <FieldLabel htmlFor="tz">Operating timezone</FieldLabel>
            <FilterMenu
              label=""
              value={timezone}
              onChange={setTimezone}
              className="w-full justify-between"
              options={[
                { value: "Europe/Amsterdam", label: "Europe/Amsterdam" },
                { value: "Europe/Berlin", label: "Europe/Berlin" },
                { value: "Europe/Madrid", label: "Europe/Madrid" },
                { value: "Europe/Warsaw", label: "Europe/Warsaw" },
              ]}
            />
          </div>
          <div>
            <FieldLabel htmlFor="units">Units</FieldLabel>
            <FilterMenu
              label=""
              value={units}
              onChange={setUnits}
              className="w-full justify-between"
              options={[
                { value: "metric", label: "Metric (t, km)" },
                { value: "imperial", label: "Imperial (lb, mi)" },
              ]}
            />
          </div>
          <div>
            <FieldLabel htmlFor="week">Week starts on</FieldLabel>
            <FilterMenu
              label=""
              value={firstDay}
              onChange={setFirstDay}
              className="w-full justify-between"
              options={[
                { value: "monday", label: "Monday" },
                { value: "sunday", label: "Sunday" },
              ]}
            />
          </div>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Alerting" description="When NORTHLINE should raise an exception" />
        <div className="px-5 py-1">
          <Toggle
            id="cap"
            label="Warehouse capacity threshold"
            hint="Raise a warning once a site passes 88% of pallet positions."
            defaultChecked
          />
          <Toggle
            id="delay"
            label="Delay escalation"
            hint="Escalate to critical when a load is more than 45 minutes behind its window."
            defaultChecked
          />
          <Toggle
            id="hours"
            label="Driving-time warnings"
            hint="Alert a planner 60 minutes before a driver reaches their Regulation 561/2006 limit."
            defaultChecked
          />
          <Toggle
            id="temp"
            label="Cold chain monitoring"
            hint="Alert on any reefer excursion outside the booked set point."
            defaultChecked
          />
          <Toggle
            id="digest"
            label="Daily digest email"
            hint="Send a summary of yesterday's exceptions at 06:00 local time."
          />
        </div>
      </Panel>

      <div className="flex items-center justify-end gap-3">
        {saved && <span className="text-success-text text-small font-medium">Changes saved</span>}
        <Button variant="ghost" onClick={() => setSaved(false)}>
          Discard
        </Button>
        <Button variant="primary" onClick={() => setSaved(true)}>
          Save changes
        </Button>
      </div>
    </>
  );
}
