"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, CalendarDays, Sparkles, Users } from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";

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
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { addDays, diffDays, formatFull } from "@/lib/dates";
import {
  LABELS,
  PROJECT_TYPES,
  artistsForLabel,
  projectTypeLabel,
} from "@/lib/constants";
import { TEAM_ROLES } from "@/lib/team";
import { useTeam } from "@/components/team/team-provider";
import type { CustomTaskInput, TaskTemplate } from "@/lib/types";

const formSchema = z.object({
  songTitle: z.string().min(1, "กรอกชื่อเพลง"),
  artist: z.string().min(1, "เลือกศิลปินจากรายชื่อ"),
  label: z.string().min(1, "เลือกสังกัด"),
  projectType: z.string().min(1, "เลือกประเภทโปรเจกต์"),
  releaseDate: z.date({ message: "เลือกวันปล่อยเพลง" }),
});

export type NewProjectInput = z.infer<typeof formSchema>;

const EMPTY: Partial<NewProjectInput> = {
  songTitle: "",
  artist: "",
  label: "",
  projectType: "Single",
  releaseDate: undefined,
};

// Radix Select can't use "" as an item value; sentinel for "leave unassigned".
const NONE = "__none__";

/**
 * Controlled create/edit dialog for a project (Phase 1 fields).
 * In "edit" mode it pre-populates from `values`.
 */
export type ProjectFormSubmit = NewProjectInput & {
  assignments?: Record<string, string>;
  /** Customized timeline from the Step-2 review (create wizard only). */
  tasks?: CustomTaskInput[];
};

/** A previewed/editable task in Step 2 (deadline is absolute + editable). */
interface DraftTask {
  key: string;
  taskName: string;
  role: string;
  person: string;
  category: string;
  tMinusDays: number;
  durationDays: number;
  taskKey: string | null;
  sortOrder: number;
  deadline: Date;
}

export function ProjectFormDialog({
  open,
  onOpenChange,
  mode,
  values,
  onSubmit,
  taskTemplates = [],
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  values?: NewProjectInput;
  onSubmit: (values: ProjectFormSubmit) => void | Promise<void>;
  /** Templates (all types) — used to know which roles a new project will need. */
  taskTemplates?: TaskTemplate[];
}) {
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const { membersOfRole } = useTeam();
  // Explicit per-role picks; unset roles fall back to the role's first member.
  const [assignments, setAssignments] = React.useState<Record<string, string>>(
    {}
  );
  // Wizard: Step 1 = details, Step 2 = timeline review (create mode only).
  const [step, setStep] = React.useState<1 | 2>(1);
  const [draftTasks, setDraftTasks] = React.useState<DraftTask[]>([]);
  const [confirming, setConfirming] = React.useState(false);

  const form = useForm<NewProjectInput>({
    resolver: zodResolver(formSchema),
    defaultValues: EMPTY,
    // `values` re-syncs the form whenever the edited project changes.
    values,
  });

  const errors = form.formState.errors;
  const isSaving = form.formState.isSubmitting;
  const isEdit = mode === "edit";

  // Dependent dropdown: artist options follow the selected label.
  const selectedLabel = useWatch({ control: form.control, name: "label" });
  const selectedArtist = useWatch({ control: form.control, name: "artist" });
  const artistOptions = React.useMemo(() => {
    const list = artistsForLabel(selectedLabel ?? "");
    // Keep an already-saved artist visible even if it's not in the master
    // list (legacy data), so the Edit form shows the current value.
    if (selectedArtist && !list.includes(selectedArtist)) {
      return [selectedArtist, ...list];
    }
    return list;
  }, [selectedLabel, selectedArtist]);

  // Distinct roles the selected project type's tasks will use — one assignment
  // dropdown per role, ordered by the canonical department order.
  const selectedType = useWatch({ control: form.control, name: "projectType" });
  const rolesForType = React.useMemo(() => {
    const roles = new Set<string>();
    for (const t of taskTemplates) {
      if (t.projectType === selectedType && t.role) roles.add(t.role);
    }
    const rank = (r: string) => {
      const i = (TEAM_ROLES as readonly string[]).indexOf(r);
      return i === -1 ? TEAM_ROLES.length : i;
    };
    return [...roles].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
  }, [taskTemplates, selectedType]);

  // Unset roles default to the first member of that role (never unassigned).
  const resolvedAssignee = (role: string) =>
    assignments[role] ?? membersOfRole(role)[0] ?? "";

  // Build the preview timeline from the selected type's templates + assignments,
  // in strict chronological order (earliest deadline first).
  const computeDraftTasks = (formValues: NewProjectInput): DraftTask[] =>
    taskTemplates
      .filter((t) => t.projectType === formValues.projectType)
      .map((t) => ({
        key: t.id,
        taskName: t.taskName,
        role: t.role,
        person: resolvedAssignee(t.role),
        category: t.category,
        tMinusDays: t.tMinusDays,
        durationDays: t.durationDays,
        taskKey: t.taskKey || null,
        sortOrder: t.sortOrder,
        deadline: addDays(formValues.releaseDate, -t.tMinusDays),
      }))
      .toSorted((a, b) => a.deadline.getTime() - b.deadline.getTime());

  const updateDraft = (key: string, patch: Partial<DraftTask>) =>
    setDraftTasks((prev) =>
      prev.map((d) => (d.key === key ? { ...d, ...patch } : d))
    );

  function handleOpenChange(next: boolean) {
    if (!next) {
      setSaveError(null);
      setAssignments({});
      setStep(1);
      setDraftTasks([]);
      form.reset(values ?? EMPTY);
    }
    onOpenChange(next);
  }

  // Step 1 submit: edit saves immediately; create advances to the review step.
  async function handleFormSubmit(formValues: NewProjectInput) {
    setSaveError(null);
    if (isEdit) {
      try {
        await onSubmit({ ...formValues });
        handleOpenChange(false);
      } catch (err) {
        setSaveError(
          err instanceof Error ? err.message : "บันทึกไม่สำเร็จ ลองอีกครั้ง"
        );
      }
      return;
    }
    setDraftTasks(computeDraftTasks(formValues));
    setStep(2);
  }

  // Step 2 confirm: create the project with the customized task list.
  async function handleConfirm() {
    setSaveError(null);
    setConfirming(true);
    try {
      const formValues = form.getValues();
      const assignmentsFinal: Record<string, string> = {};
      for (const role of rolesForType) {
        const person = resolvedAssignee(role);
        if (person) assignmentsFinal[role] = person;
      }
      const tasks: CustomTaskInput[] = draftTasks.map((d) => ({
        taskName: d.taskName.trim() || d.taskName,
        role: d.role,
        person: d.person,
        category: d.category,
        // Editing the deadline overrides the standard T-minus offset.
        tMinusDays: diffDays(d.deadline, formValues.releaseDate),
        durationDays: d.durationDays,
        taskKey: d.taskKey ?? undefined,
        sortOrder: d.sortOrder,
      }));
      await onSubmit({ ...formValues, assignments: assignmentsFinal, tasks });
      handleOpenChange(false);
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "บันทึกไม่สำเร็จ ลองอีกครั้ง"
      );
    } finally {
      setConfirming(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {/* preventDefault on close-auto-focus: when opened from the row's
          dropdown menu, the menu trigger may unmount, so returning focus to
          it would crash Radix's focus scope (reading 'dispatchEvent'). */}
      <DialogContent
        className={cn("sm:max-w-md", !isEdit && step === 2 && "sm:max-w-2xl")}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? "Edit Project"
              : step === 1
                ? "Initiate New Release · Step 1 of 2"
                : "Review Timeline · Step 2 of 2"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "แก้ไขข้อมูลโปรเจกต์ — Workback Timeline จะคำนวณเดดไลน์ใหม่ตามวันปล่อย"
              : step === 1
                ? "ข้อมูลตั้งต้นโปรเจกต์ — ตรวจสอบและปรับไทม์ไลน์ได้ในขั้นถัดไป"
                : "ปรับชื่องานและเดดไลน์ได้ก่อนยืนยันสร้างโปรเจกต์"}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <form
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className="space-y-6"
            noValidate
          >
          <FieldGroup>
            {!isEdit && (
              <Field data-invalid={!!errors.projectType}>
                <FieldLabel>Project Type</FieldLabel>
                <Controller
                  control={form.control}
                  name="projectType"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        className="w-full"
                        aria-invalid={!!errors.projectType}
                      >
                        <SelectValue placeholder="เลือกประเภทโปรเจกต์" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROJECT_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {projectTypeLabel(t)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError errors={[errors.projectType]} />
              </Field>
            )}

            <Field data-invalid={!!errors.songTitle}>
              <FieldLabel htmlFor="songTitle">Song Title</FieldLabel>
              <Input
                id="songTitle"
                placeholder="ชื่อเพลง"
                aria-invalid={!!errors.songTitle}
                {...form.register("songTitle")}
              />
              <FieldError errors={[errors.songTitle]} />
            </Field>

            <Field data-invalid={!!errors.label}>
              <FieldLabel>Label</FieldLabel>
              <Controller
                control={form.control}
                name="label"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(next) => {
                      if (next !== field.value) {
                        // Force a valid artist for the new label
                        form.setValue("artist", "", { shouldValidate: false });
                      }
                      field.onChange(next);
                    }}
                  >
                    <SelectTrigger
                      className="w-full"
                      aria-invalid={!!errors.label}
                    >
                      <SelectValue placeholder="เลือกสังกัด" />
                    </SelectTrigger>
                    <SelectContent>
                      {LABELS.map((label) => (
                        <SelectItem key={label} value={label}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.label]} />
            </Field>

            <Field data-invalid={!!errors.artist}>
              <FieldLabel>Artist Name</FieldLabel>
              <Controller
                control={form.control}
                name="artist"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={!selectedLabel}
                  >
                    <SelectTrigger
                      className="w-full"
                      aria-invalid={!!errors.artist}
                    >
                      <SelectValue
                        placeholder={
                          selectedLabel ? "เลือกศิลปิน" : "เลือกสังกัดก่อน"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {artistOptions.map((artist) => (
                        <SelectItem key={artist} value={artist}>
                          {artist}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.artist]} />
            </Field>

            <Field data-invalid={!!errors.releaseDate}>
              <FieldLabel>Release Date</FieldLabel>
              <Controller
                control={form.control}
                name="releaseDate"
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        aria-invalid={!!errors.releaseDate}
                        className={cn(
                          "w-full justify-start font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        <CalendarDays data-icon="inline-start" />
                        {field.value
                          ? formatFull(field.value)
                          : "เลือกวันปล่อยเพลง"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        // Only block past dates when creating; an existing
                        // release may already be near/at its date.
                        disabled={isEdit ? undefined : { before: new Date() }}
                        autoFocus
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
              <FieldError errors={[errors.releaseDate]} />
            </Field>
          </FieldGroup>

          {/* Auto-assign: one dropdown per role the new project's tasks use */}
          {!isEdit && rolesForType.length > 0 && (
            <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center gap-2">
                <Users className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium">Team Assignments</span>
              </div>
              <p className="text-xs text-muted-foreground">
                เลือกผู้รับผิดชอบแต่ละแผนก — งานที่สร้างจะถูกมอบหมายให้อัตโนมัติ
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {rolesForType.map((role) => {
                  const members = membersOfRole(role);
                  const value = resolvedAssignee(role);
                  return (
                    <div key={role} className="space-y-1.5">
                      <FieldLabel>{role}</FieldLabel>
                      <Select
                        value={value || NONE}
                        onValueChange={(v) =>
                          setAssignments((prev) => ({
                            ...prev,
                            [role]: v === NONE ? "" : v,
                          }))
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="ยังไม่ระบุ" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NONE}>
                            <span className="text-muted-foreground">
                              ยังไม่ระบุ
                            </span>
                          </SelectItem>
                          {members.map((m) => (
                            <SelectItem key={m} value={m}>
                              {m}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {saveError && (
            <p className="text-sm text-destructive" role="alert">
              {saveError}
            </p>
          )}

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="ghost" disabled={isSaving}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSaving}>
                {isEdit ? (
                  isSaving ? (
                    "Saving…"
                  ) : (
                    "Save Changes"
                  )
                ) : (
                  <>
                    Next: Review Timeline
                    <ArrowRight data-icon="inline-end" />
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="text-xs text-muted-foreground">
              จะสร้าง {draftTasks.length} งาน — ปรับชื่อและเดดไลน์ได้ตามต้องการ
            </div>
            <div className="max-h-[55vh] space-y-2 overflow-y-auto pr-1">
              {draftTasks.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  ประเภทนี้ยังไม่มี Template งาน — จะสร้างโปรเจกต์เปล่า
                </p>
              ) : (
                draftTasks.map((d) => (
                  <div
                    key={d.key}
                    className="space-y-2 rounded-lg border p-2.5"
                  >
                    <Input
                      value={d.taskName}
                      onChange={(e) =>
                        updateDraft(d.key, { taskName: e.target.value })
                      }
                      className="h-8"
                      placeholder="ชื่องาน"
                    />
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs text-muted-foreground">
                        {d.role}
                        {d.person ? ` · ${d.person}` : ""}
                      </span>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1.5 font-normal"
                          >
                            <CalendarDays className="size-3.5" />
                            {formatFull(d.deadline)}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                          <Calendar
                            mode="single"
                            selected={d.deadline}
                            onSelect={(date) =>
                              date && updateDraft(d.key, { deadline: date })
                            }
                            autoFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                ))
              )}
            </div>

            {saveError && (
              <p className="text-sm text-destructive" role="alert">
                {saveError}
              </p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep(1)}
                disabled={confirming}
              >
                <ArrowLeft data-icon="inline-start" />
                Back
              </Button>
              <Button
                type="button"
                onClick={handleConfirm}
                disabled={confirming}
              >
                <Sparkles data-icon="inline-start" />
                {confirming ? "Creating…" : "Confirm & Create Project"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
