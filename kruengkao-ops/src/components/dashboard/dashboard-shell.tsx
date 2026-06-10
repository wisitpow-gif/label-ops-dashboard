"use client";

import { ChartGantt, Disc3, Plus, Table2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GanttChart } from "./gantt-chart";
import { ProjectTable } from "./project-table";

export function DashboardShell() {
  return (
    <TooltipProvider delayDuration={150}>
      <div className="mx-auto w-full max-w-7xl space-y-6 p-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
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
          </div>
          {/* Placeholder for the Foolproof Data Entry modal (Blueprint Part 2.2) */}
          <Button disabled>
            <Plus data-icon="inline-start" />
            Initiate Project
          </Button>
        </header>

        <Tabs defaultValue="table">
          <TabsList>
            <TabsTrigger value="table">
              <Table2 data-icon="inline-start" />
              Project View
            </TabsTrigger>
            <TabsTrigger value="gantt">
              <ChartGantt data-icon="inline-start" />
              Gantt Chart
            </TabsTrigger>
          </TabsList>
          <TabsContent value="table">
            <ProjectTable />
          </TabsContent>
          <TabsContent value="gantt">
            <GanttChart />
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}
