import type { Metadata } from "next";
import { Mail, Plus } from "lucide-react";
import { PageHeader, Panel, PanelHeader } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/status";
import { CapacityBar } from "@/components/ui/metric";
import { DRIVERS, FACILITIES } from "@/lib/data";
import { formatNumber } from "@/lib/utils";

export const metadata: Metadata = { title: "Team" };

const ROLES = [
  "Operations manager",
  "Dispatcher",
  "Fleet manager",
  "Warehouse manager",
  "Supply chain analyst",
  "Customs coordinator",
];

export default function TeamPage() {
  const people = FACILITIES.map((f, i) => ({
    name: f.manager,
    role: ROLES[i % ROLES.length],
    site: f.name,
    region: f.country,
    initials: f.manager
      .split(" ")
      .filter((p) => p[0] === p[0].toUpperCase())
      .slice(0, 2)
      .map((p) => p[0])
      .join(""),
    load: 55 + ((i * 13) % 42),
  }));

  return (
    <div className="mx-auto flex max-w-[112rem] flex-col gap-4 p-4 sm:p-5">
      <PageHeader
        title="Team"
        description={`${people.length} site managers and ${DRIVERS.length} drivers across the network.`}
        actions={
          <Button variant="primary">
            <Plus className="size-4" aria-hidden />
            Invite member
          </Button>
        }
      />

      <Panel>
        <PanelHeader title="Site managers" description="One owner per facility" />
        <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {people.map((p, i) => (
            <li
              key={p.name}
              className="border-line border-b px-5 py-4 md:[&:nth-child(odd)]:border-r xl:[&:nth-child(odd)]:border-r-0 xl:[&:not(:nth-child(3n))]:border-r"
            >
              <div className="flex items-center gap-3">
                <span className="bg-brand-soft text-brand grid size-9 shrink-0 place-items-center rounded-full text-small font-semibold">
                  {p.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-ink truncate text-body font-medium">{p.name}</p>
                  <p className="text-ink-3 truncate text-caption">{p.role}</p>
                </div>
                <Badge tone={i % 5 === 0 ? "success" : "neutral"} dot>
                  {i % 5 === 0 ? "On shift" : "Available"}
                </Badge>
              </div>
              <p className="text-ink-2 text-small mt-2.5">{p.site}</p>
              <div className="mt-2">
                <div className="mb-1 flex items-baseline justify-between text-caption">
                  <span className="text-ink-3">Workload</span>
                  <span className="text-ink font-semibold tabular-nums">{p.load}%</span>
                </div>
                <CapacityBar value={p.load} height={4} tone={p.load > 85 ? "warning" : "brand"} />
              </div>
              <a
                href={`mailto:${p.name.toLowerCase().replace(/[^a-z]+/g, ".")}@northline.eu`}
                className="text-ink-3 hover:text-brand mt-2.5 inline-flex items-center gap-1.5 text-caption transition-colors"
              >
                <Mail className="size-3" aria-hidden />
                {p.name.toLowerCase().replace(/[^a-z]+/g, ".")}@northline.eu
              </a>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel>
        <PanelHeader
          title="Drivers"
          description={`${formatNumber(DRIVERS.length)} active, ranked by on-time record`}
        />
        <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
          {[...DRIVERS]
            .sort((a, b) => b.onTimeRate - a.onTimeRate)
            .slice(0, 12)
            .map((d) => (
              <li
                key={d.id}
                className="border-line flex items-center gap-2.5 border-b px-5 py-3 sm:[&:nth-child(odd)]:border-r xl:[&:nth-child(odd)]:border-r-0 xl:[&:not(:nth-child(4n))]:border-r"
              >
                <span className="bg-surface-sunken text-ink-2 grid size-8 shrink-0 place-items-center rounded-full text-caption font-semibold">
                  {d.initials}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="text-ink block truncate text-small font-medium">{d.name}</span>
                  <span className="text-ink-3 block truncate text-caption">{d.base}</span>
                </span>
                <span className="text-ink shrink-0 text-small font-semibold tabular-nums">
                  {d.onTimeRate}%
                </span>
              </li>
            ))}
        </ul>
      </Panel>
    </div>
  );
}
