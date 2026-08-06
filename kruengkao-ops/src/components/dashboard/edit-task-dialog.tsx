"use client";

import * as React from "react";
import { CalendarDays } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { formatFull, parseDate, toISODate } from "@/lib/dates";
import { taskDeadline, taskStart } from "@/lib/mock-data";
import type { Project, Task } from "@/lib/types";

export interface EditTaskPatch {
  taskName: string;
  startDate: string; // yyyy-mm-dd
  endDate: string; // yyyy-mm-dd
}

/** Labeled date picker used for both Start and End. */
function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: Date;
  onChange: (d: Date) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              "w-full justify-start font-normal",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarDays data-icon="inline-start" />
            {value ? formatFull(value) : "เลือกวันที่"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={(d) => d && onChange(d)}
            autoFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

/** Reusable modal to edit a task's name + start/end date range. */
export function EditTaskDialog({
  task,
  project,
  open,
  onOpenChange,
  onSave,
}: {
  task: Task;
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (patch: EditTaskPatch) => Promise<void>;
}) {
  const initialEnd = project
    ? taskDeadline(task, project)
    : task.endDate
      ? parseDate(task.endDate)
      : new Date();
  const initialStart = project
    ? taskStart(task, project)
    : task.startDate
      ? parseDate(task.startDate)
      : initialEnd;

  const [name, setName] = React.useState(task.name);
  const [start, setStart] = React.useState<Date | undefined>(initialStart);
  const [end, setEnd] = React.useState<Date | undefined>(initialEnd);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("กรอกชื่องาน");
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
      await onSave({
        taskName: name.trim(),
        startDate: toISODate(start),
        endDate: toISODate(end),
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        // Opened from a card/row/calendar block that may unmount — keep focus.
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>แก้ไขงาน</DialogTitle>
          <DialogDescription>
            {project
              ? `${project.songName} · ${project.artistName}`
              : "แก้ไขชื่องานและช่วงเวลา"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-task-name">Task Name</Label>
            <Input
              id="edit-task-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ชื่องาน"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DateField label="Start Date" value={start} onChange={setStart} />
            <DateField label="End Date" value={end} onChange={setEnd} />
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
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
