"use client";

import * as React from "react";
import { Lock } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { parseDate, startOfToday, toISODate } from "@/lib/dates";
import { initialsOf } from "@/lib/mock-data";
import { TEAM_ROLES } from "@/lib/team";
import { useTeam } from "@/components/team/team-provider";
import type { Project, TaskGroup } from "@/lib/types";
import { DateField } from "./edit-task-dialog";

export interface CreateTaskValues {
  taskName: string;
  role: string;
  person: string;
  startDate: string; // yyyy-mm-dd
  endDate: string; // yyyy-mm-dd
}

/**
 * "Create Custom Task" modal launched from a category's inline "+ Add Task"
 * button. The Category is pre-filled and locked to the column that opened it;
 * an Assignee is strictly required, and the Assignee list is filtered to the
 * members of the chosen Role.
 */
export function CreateTaskDialog({
  project,
  category,
  open,
  onOpenChange,
  onCreate,
}: {
  project: Project;
  category: TaskGroup;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (values: CreateTaskValues) => Promise<void>;
}) {
  const { membersOfRole } = useTeam();

  // Default the deadline to the release date (or today, if it has passed) and
  // start today — a sensible window the user can adjust.
  const today = startOfToday();
  const release = project.releaseDate ? parseDate(project.releaseDate) : today;
  const defaultEnd = release >= today ? release : today;

  const [name, setName] = React.useState("");
  const [role, setRole] = React.useState("");
  const [person, setPerson] = React.useState("");
  const [start, setStart] = React.useState<Date | undefined>(today);
  const [end, setEnd] = React.useState<Date | undefined>(defaultEnd);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const members = role ? membersOfRole(role) : [];

  // Changing role invalidates a person from a different department.
  function handleRoleChange(nextRole: string) {
    setRole(nextRole);
    if (!membersOfRole(nextRole).includes(person)) setPerson("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("กรอกชื่องาน");
      return;
    }
    if (!role) {
      setError("เลือกแผนก (Role)");
      return;
    }
    if (!person) {
      setError("ต้องระบุผู้รับผิดชอบ (Assignee) ก่อนสร้างงาน");
      return;
    }
    if (!start || !end) {
      setError("เลือกวันเริ่มและวันสิ้นสุด");
      return;
    }
    if (toISODate(end) < toISODate(start)) {
      setError("วันสิ้นสุดต้องไม่มาก่อนวันเริ่ม");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onCreate({
        taskName: name.trim(),
        role,
        person,
        startDate: toISODate(start),
        endDate: toISODate(end),
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "สร้างงานไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        // Opened from an inline button inside a row that can unmount — keep focus.
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Create Custom Task</DialogTitle>
          <DialogDescription>
            {project.songName} · {project.artistName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category — pre-filled + locked to the column that opened the modal */}
          <div className="space-y-1.5">
            <Label>Category</Label>
            <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 text-sm">
              <Lock className="size-3.5 text-muted-foreground" />
              <span className="font-medium">{category}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-task-name">Task Name</Label>
            <Input
              id="new-task-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ชื่องาน เช่น Behind the Scenes Clip"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Role */}
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={role} onValueChange={handleRoleChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="เลือกแผนก" />
                </SelectTrigger>
                <SelectContent>
                  {TEAM_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Assignee — required, filtered by the chosen role */}
            <div className="space-y-1.5">
              <Label>
                Assignee <span className="text-destructive">*</span>
              </Label>
              <Select
                value={person}
                onValueChange={setPerson}
                disabled={!role || members.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      !role
                        ? "เลือกแผนกก่อน"
                        : members.length === 0
                          ? "ไม่มีสมาชิกในแผนกนี้"
                          : "เลือกผู้รับผิดชอบ"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m} value={m}>
                      <span className="flex items-center gap-2">
                        <Avatar className="size-5">
                          <AvatarFallback className="text-[9px]">
                            {initialsOf(m)}
                          </AvatarFallback>
                        </Avatar>
                        {m}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DateField label="Start Date" value={start} onChange={setStart} />
            <DateField label="End Date (Deadline)" value={end} onChange={setEnd} />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost" disabled={saving}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={saving}>
              {saving ? "Creating…" : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
