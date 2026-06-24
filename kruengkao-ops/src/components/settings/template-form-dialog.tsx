"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

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
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TEMPLATE_CATEGORIES, TEMPLATE_ROLES } from "@/lib/constants";

const formSchema = z.object({
  taskName: z.string().min(1, "กรอกชื่องาน"),
  category: z.string().min(1, "เลือกหมวดงาน"),
  role: z.string().min(1, "เลือก Role"),
  tMinusDays: z
    .number({ message: "กรอกตัวเลข" })
    .int("ต้องเป็นจำนวนเต็ม")
    .min(0, "ต้องไม่ติดลบ"),
  durationDays: z
    .number({ message: "กรอกตัวเลข" })
    .int("ต้องเป็นจำนวนเต็ม")
    .min(0, "ต้องไม่ติดลบ"),
});

export type TemplateFormValues = z.infer<typeof formSchema>;

const EMPTY: TemplateFormValues = {
  taskName: "",
  category: TEMPLATE_CATEGORIES[0],
  role: "Unassigned",
  tMinusDays: 0,
  durationDays: 0,
};

export function TemplateFormDialog({
  open,
  onOpenChange,
  mode,
  projectType,
  values,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  projectType: string;
  values?: TemplateFormValues;
  onSubmit: (values: TemplateFormValues) => void | Promise<void>;
}) {
  const [saveError, setSaveError] = React.useState<string | null>(null);

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: EMPTY,
    values,
  });

  const errors = form.formState.errors;
  const isSaving = form.formState.isSubmitting;
  const isEdit = mode === "edit";

  function handleOpenChange(next: boolean) {
    if (!next) {
      setSaveError(null);
      form.reset(values ?? EMPTY);
    }
    onOpenChange(next);
  }

  async function handleSubmit(formValues: TemplateFormValues) {
    setSaveError(null);
    try {
      await onSubmit(formValues);
      onOpenChange(false);
      if (!isEdit) form.reset(EMPTY);
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "บันทึกไม่สำเร็จ ลองอีกครั้ง"
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Task Template" : "Add Task Template"}</DialogTitle>
          <DialogDescription>
            {projectType} workflow — เพิ่ม/แก้ไขงานในเทมเพลต
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="space-y-6"
          noValidate
        >
          <FieldGroup>
            <Field data-invalid={!!errors.taskName}>
              <FieldLabel htmlFor="taskName">Task Name</FieldLabel>
              <Input
                id="taskName"
                placeholder="เช่น Full Mix Audio"
                aria-invalid={!!errors.taskName}
                {...form.register("taskName")}
              />
              <FieldError errors={[errors.taskName]} />
            </Field>

            <Field data-invalid={!!errors.category}>
              <FieldLabel>Category</FieldLabel>
              <Controller
                control={form.control}
                name="category"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full" aria-invalid={!!errors.category}>
                      <SelectValue placeholder="เลือกหมวดงาน" />
                    </SelectTrigger>
                    <SelectContent>
                      {TEMPLATE_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.category]} />
            </Field>

            <Field data-invalid={!!errors.role}>
              <FieldLabel>Default Role</FieldLabel>
              <Controller
                control={form.control}
                name="role"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full" aria-invalid={!!errors.role}>
                      <SelectValue placeholder="เลือก Role" />
                    </SelectTrigger>
                    <SelectContent>
                      {TEMPLATE_ROLES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.role]} />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field data-invalid={!!errors.tMinusDays}>
                <FieldLabel htmlFor="tMinusDays">T-Minus (days)</FieldLabel>
                <Input
                  id="tMinusDays"
                  type="number"
                  min={0}
                  step={1}
                  aria-invalid={!!errors.tMinusDays}
                  {...form.register("tMinusDays", { valueAsNumber: true })}
                />
                <FieldError errors={[errors.tMinusDays]} />
              </Field>

              <Field data-invalid={!!errors.durationDays}>
                <FieldLabel htmlFor="durationDays">Duration (days)</FieldLabel>
                <Input
                  id="durationDays"
                  type="number"
                  min={0}
                  step={1}
                  aria-invalid={!!errors.durationDays}
                  {...form.register("durationDays", { valueAsNumber: true })}
                />
                <FieldError errors={[errors.durationDays]} />
              </Field>
            </div>
          </FieldGroup>

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
              {isSaving ? "Saving…" : isEdit ? "Save Changes" : "Add Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
