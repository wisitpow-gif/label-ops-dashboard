"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarRange,
  ChartGantt,
  ClipboardList,
  Disc3,
  LayoutDashboard,
  Library,
  ListFilter,
  Plus,
  Settings,
  SquareKanban,
  Table2,
  UserCog,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { PROJECT_TYPES, projectTypeEmoji } from "@/lib/constants";
import type { ProjectType } from "@/lib/types";
import { UserMenu } from "@/components/auth/user-menu";

// Each module is its own route, so the portal can deep-link / send a separate
// link per module. The nav is plain <Link>s highlighting the active route.
const MODULES: { href: string; label: string; icon: React.ElementType }[] = [
  { href: "/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/releases", label: "Project View", icon: Table2 },
  { href: "/workload", label: "Team Workload", icon: SquareKanban },
  { href: "/gantt", label: "Gantt Chart", icon: ChartGantt },
  { href: "/calendar", label: "Calendar View", icon: CalendarRange },
];

export function AppHeader({
  userEmail,
  selectedTypes,
  allTypesSelected,
  onToggleType,
  onCreate,
}: {
  userEmail?: string | null;
  selectedTypes: Set<ProjectType>;
  allTypesSelected: boolean;
  onToggleType: (type: ProjectType) => void;
  onCreate: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/overview" className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-foreground text-background">
            <Disc3 className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              ครึ่งเก้า — Label Ops
            </h1>
            <p className="text-sm text-muted-foreground">
              Release Dashboard · Workback Timeline
            </p>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" aria-label="กรองตามประเภทโปรเจกต์">
                <ListFilter data-icon="inline-start" />
                Project Types
                <span className="ml-1 rounded-full bg-muted px-1.5 text-xs tabular-nums text-muted-foreground">
                  {allTypesSelected ? "All" : selectedTypes.size}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-52 p-2">
              <div className="px-1 pb-1.5 text-xs font-medium text-muted-foreground">
                Show project types
              </div>
              {PROJECT_TYPES.map((type) => (
                <label
                  key={type}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1.5 text-sm hover:bg-accent"
                >
                  <Checkbox
                    checked={selectedTypes.has(type)}
                    onCheckedChange={() => onToggleType(type)}
                  />
                  <span aria-hidden>{projectTypeEmoji(type)}</span>
                  {type}
                </label>
              ))}
            </PopoverContent>
          </Popover>
          <Button onClick={onCreate}>
            <Plus data-icon="inline-start" />
            Create Project
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button asChild variant="outline" size="icon" aria-label="Internal Work">
                <Link href="/internal">
                  <ClipboardList />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Internal / Ad-Hoc Work</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button asChild variant="outline" size="icon" aria-label="Library Map">
                <Link href="/library">
                  <Library />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Library Map</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button asChild variant="outline" size="icon" aria-label="Team Members">
                <Link href="/settings">
                  <UserCog />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Team Members</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button asChild variant="outline" size="icon" aria-label="Workflow Templates">
                <Link href="/settings/templates">
                  <Settings />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Workflow Templates</TooltipContent>
          </Tooltip>
          <UserMenu email={userEmail ?? null} />
        </div>
      </header>

      {/* Module nav — one route per module (deep-linkable for the portal) */}
      <nav className="flex flex-wrap gap-1 border-b pb-px">
        {MODULES.map((m) => {
          const active = pathname === m.href;
          const Icon = m.icon;
          return (
            <Link
              key={m.href}
              href={m.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
            >
              <Icon className="size-4" />
              {m.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
