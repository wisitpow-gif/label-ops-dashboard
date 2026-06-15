import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TaskStatus } from "@/lib/types";

export const STATUS_STYLES: Record<TaskStatus, string> = {
  "Not Start": "border-border bg-transparent text-muted-foreground",
  WIP: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  Done: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  Blocked: "bg-red-500/15 text-red-700 dark:text-red-400",
};

export const STATUS_LABELS: Record<TaskStatus, string> = {
  "Not Start": "Not Start",
  WIP: "WIP",
  Done: "Done",
  Blocked: "Blocked",
};

export const STATUS_OPTIONS: TaskStatus[] = [
  "Not Start",
  "WIP",
  "Done",
  "Blocked",
];

export function StatusBadge({
  status,
  className,
}: {
  status: TaskStatus;
  className?: string;
}) {
  return (
    <Badge variant="outline" className={cn("border-transparent", STATUS_STYLES[status], className)}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
