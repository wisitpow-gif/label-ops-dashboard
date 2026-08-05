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
import { diffDays, formatFull, parseDate } from "@/lib/dates";
import { taskDeadline } from "@/lib/mock-data";
import type { Project, Task } from "@/lib/types";

export interface EditTaskPatch {
  taskName: string;
  /** deadline = release_date - tMinusDays (workback offset) */
  tMinusDays: number;
}

/**
 * Reusable modal to edit a task's name + deadline. The deadline is stored as a
 * workback offset (t_minus_days) so every existing view reflects it directly.
 */
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
  const hasReleaseDate = !!project?.releaseDate;
  const [name, setName] = React.useState(task.name);
  const [deadline, setDeadline] = React.useState<Date | undefined>(
    hasReleaseDate ? taskDeadline(task, project!) : undefined
  );
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("กรอกชื่องาน");
      return;
    }
    if (!deadline) {
      setError("เลือกวันกำหนดส่ง");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const tMinusDays = hasReleaseDate
        ? diffDays(deadline, parseDate(project!.releaseDate))
        : task.tMinusDays;
      await onSave({ taskName: name.trim(), tMinusDays });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  const tMinus =
    hasReleaseDate && deadline
      ? diffDays(deadline, parseDate(project!.releaseDate))
      : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        // Opened from a card/row that may unmount — don't restore focus to it.
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>แก้ไขงาน</DialogTitle>
          <DialogDescription>
            {project
              ? `${project.songName} · ${project.artistName}`
              : "แก้ไขชื่องานและวันกำหนดส่ง"}
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

          <div className="space-y-1.5">
            <Label>Deadline</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!hasReleaseDate}
                  className={cn(
                    "w-full justify-start font-normal",
                    !deadline && "text-muted-foreground"
                  )}
                >
                  <CalendarDays data-icon="inline-start" />
                  {deadline ? formatFull(deadline) : "เลือกวันกำหนดส่ง"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={deadline}
                  onSelect={setDeadline}
                  autoFocus
                />
              </PopoverContent>
            </Popover>
            {hasReleaseDate && tMinus !== null && (
              <p className="text-xs text-muted-foreground">
                ปล่อยเพลง {formatFull(parseDate(project!.releaseDate))} · T-
                {tMinus}
              </p>
            )}
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
