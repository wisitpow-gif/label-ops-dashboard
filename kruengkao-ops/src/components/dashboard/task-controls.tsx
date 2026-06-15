"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { memberById } from "@/lib/mock-data";
import type { TaskStatus } from "@/lib/types";
import { STATUS_LABELS, STATUS_OPTIONS, STATUS_STYLES } from "./status-badge";

// Small colored dot used in the status dropdown menu (mirrors STATUS_STYLES)
const STATUS_DOT: Record<TaskStatus, string> = {
  "Not Start": "bg-muted-foreground/50",
  WIP: "bg-blue-500",
  Done: "bg-emerald-500",
  Blocked: "bg-red-500",
};

/**
 * Status as a clickable badge-styled Select.
 * The trigger keeps the colored-pill look; the menu lists all four statuses.
 */
export function StatusSelect({
  value,
  onChange,
}: {
  value: TaskStatus;
  onChange: (next: TaskStatus) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as TaskStatus)}>
      <SelectTrigger
        size="sm"
        aria-label="เปลี่ยนสถานะงาน"
        className={cn(
          "h-6 gap-1 rounded-full border-transparent px-2.5 text-xs font-medium shadow-none",
          "[&>svg]:size-3 [&>svg]:opacity-60",
          STATUS_STYLES[value]
        )}
      >
        <SelectValue />
      </SelectTrigger>
      {/* popper anchors to the trigger — item-aligned mis-positions inside
          the scrollable table (renders at the top-left of the page) */}
      <SelectContent position="popper" align="end" sideOffset={4}>
        {STATUS_OPTIONS.map((s) => (
          <SelectItem key={s} value={s}>
            <span className="flex items-center gap-2">
              <span className={cn("size-2 rounded-full", STATUS_DOT[s])} />
              {STATUS_LABELS[s]}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Sentinel — Radix Select forbids an empty-string item value
const UNASSIGNED = "unassigned";

// Assignable staff, in the order requested for the dropdown
const PIC_OPTION_IDS = ["mind", "ploy", "benz", "golf", "toon"];

/**
 * Person-In-Charge as an avatar-pill Select.
 * Stores "" on the task when Unassigned is chosen.
 */
export function PicSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (picId: string) => void;
}) {
  const selected = memberById(value);

  return (
    <Select
      value={value || UNASSIGNED}
      onValueChange={(v) => onChange(v === UNASSIGNED ? "" : v)}
    >
      <SelectTrigger
        size="sm"
        aria-label="มอบหมายผู้รับผิดชอบ"
        className={cn(
          "h-6 gap-1.5 rounded-full border-transparent bg-muted py-0 pr-2 pl-1 text-xs shadow-none",
          "[&>svg]:size-3 [&>svg]:opacity-60"
        )}
      >
        {selected ? (
          <span className="flex items-center gap-1.5">
            <Avatar className="size-4">
              <AvatarFallback className="text-[8px]">
                {selected.initials}
              </AvatarFallback>
            </Avatar>
            <span className="text-foreground/80">{selected.name}</span>
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="flex size-4 items-center justify-center rounded-full border border-dashed text-[8px]">
              ?
            </span>
            Unassigned
          </span>
        )}
      </SelectTrigger>
      <SelectContent position="popper" align="end" sideOffset={4}>
        <SelectItem value={UNASSIGNED}>
          <span className="text-muted-foreground">Unassigned</span>
        </SelectItem>
        {PIC_OPTION_IDS.map((id) => {
          const m = memberById(id);
          if (!m) return null;
          return (
            <SelectItem key={id} value={id}>
              <span className="flex items-center gap-2">
                <Avatar className="size-5">
                  <AvatarFallback className="text-[9px]">
                    {m.initials}
                  </AvatarFallback>
                </Avatar>
                {m.name}
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
