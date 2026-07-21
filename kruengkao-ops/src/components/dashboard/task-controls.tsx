"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { TEAM_STRUCTURE, UNASSIGNED, initialsOf } from "@/lib/mock-data";
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

// Encode/decode the 2-tier value as "Role::Person" (a person name can repeat
// across roles, e.g. "Ken" in both Promoter and Graphics, so role is required).
const SEP = "::";
const encode = (role: string, person: string) => `${role}${SEP}${person}`;

/**
 * Assignee as a hierarchical Select: staff grouped under their Role.
 * The user picks a specific person; choosing one sets both role and person.
 */
export function AssigneeSelect({
  role,
  person,
  onChange,
}: {
  role: string;
  person: string;
  onChange: (patch: { role: string; person: string }) => void;
}) {
  const value = person ? encode(role, person) : UNASSIGNED;

  function handleChange(v: string) {
    if (v === UNASSIGNED) {
      onChange({ role: UNASSIGNED, person: "" });
      return;
    }
    const [nextRole, nextPerson] = v.split(SEP);
    onChange({ role: nextRole, person: nextPerson });
  }

  return (
    <Select value={value} onValueChange={handleChange}>
      <SelectTrigger
        size="sm"
        aria-label="มอบหมายผู้รับผิดชอบ"
        className={cn(
          "h-6 gap-1.5 rounded-full border-transparent bg-muted py-0 pr-2 pl-1 text-xs shadow-none",
          "[&>svg]:size-3 [&>svg]:opacity-60"
        )}
      >
        {person ? (
          <span className="flex items-center gap-1.5">
            <Avatar className="size-4">
              <AvatarFallback className="text-[8px]">
                {initialsOf(person)}
              </AvatarFallback>
            </Avatar>
            <span className="text-foreground/80">{person}</span>
            <span className="text-muted-foreground">· {role}</span>
          </span>
        ) : role && role !== UNASSIGNED ? (
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="flex size-4 items-center justify-center rounded-full border border-dashed text-[8px]">
              ?
            </span>
            {role}
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
        {TEAM_STRUCTURE.map((group) => (
          <SelectGroup key={group.role}>
            <SelectSeparator />
            <SelectLabel>{group.role}</SelectLabel>
            {group.members.map((member) => (
              <SelectItem
                key={encode(group.role, member)}
                value={encode(group.role, member)}
              >
                <span className="flex items-center gap-2">
                  <Avatar className="size-5">
                    <AvatarFallback className="text-[9px]">
                      {initialsOf(member)}
                    </AvatarFallback>
                  </Avatar>
                  {member}
                </span>
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
