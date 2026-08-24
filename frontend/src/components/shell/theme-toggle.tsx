"use client";

import * as React from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { Menu, MenuContent, MenuItem, MenuLabel, MenuTrigger } from "@/components/ui/dropdown";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark" | "system";
const KEY = "northline-theme";

function apply(theme: Theme) {
  const dark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

/**
 * The stored preference lives in localStorage, which is an external store rather than
 * React state. Reading it through useSyncExternalStore keeps the server render and the
 * first client render in agreement without a mount effect.
 */
const themeStore = {
  listeners: new Set<() => void>(),
  subscribe(listener: () => void) {
    themeStore.listeners.add(listener);
    window.addEventListener("storage", listener);
    return () => {
      themeStore.listeners.delete(listener);
      window.removeEventListener("storage", listener);
    };
  },
  emit() {
    for (const listener of themeStore.listeners) listener();
  },
  getSnapshot(): Theme {
    try {
      return ((localStorage.getItem(KEY) as Theme) ?? "light");
    } catch {
      return "light";
    }
  },
  getServerSnapshot(): Theme {
    return "light";
  },
};

export function ThemeToggle() {
  const theme = React.useSyncExternalStore(
    themeStore.subscribe,
    themeStore.getSnapshot,
    themeStore.getServerSnapshot,
  );
  const mounted = React.useSyncExternalStore(
    themeStore.subscribe,
    () => true,
    () => false,
  );

  // Follow the OS while the user has chosen to track it.
  React.useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  const choose = (next: Theme) => {
    localStorage.setItem(KEY, next);
    apply(next);
    themeStore.emit();
  };

  const Icon = theme === "dark" ? Moon : theme === "system" ? Monitor : Sun;

  return (
    <Menu>
      <Tooltip content="Appearance">
        <MenuTrigger asChild>
          <button
            type="button"
            aria-label="Change appearance"
            className="text-ink-2 hover:bg-neutral-soft hover:text-ink grid size-8 place-items-center rounded-control transition-colors"
          >
            {mounted ? <Icon className="size-4" /> : <span className="size-4" />}
          </button>
        </MenuTrigger>
      </Tooltip>
      <MenuContent>
        <MenuLabel>Appearance</MenuLabel>
        {(
          [
            ["light", "Light", Sun],
            ["dark", "Dark", Moon],
            ["system", "System", Monitor],
          ] as const
        ).map(([value, label, ItemIcon]) => (
          <MenuItem key={value} onSelect={() => choose(value)}>
            <ItemIcon className="size-3.5 shrink-0" aria-hidden />
            <span className="flex-1">{label}</span>
            <span
              className={cn(
                "bg-brand size-1.5 rounded-full",
                theme === value ? "opacity-100" : "opacity-0",
              )}
              aria-hidden
            />
          </MenuItem>
        ))}
      </MenuContent>
    </Menu>
  );
}
