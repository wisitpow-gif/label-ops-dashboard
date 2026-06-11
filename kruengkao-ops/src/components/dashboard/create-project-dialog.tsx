"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDays, Plus, Sparkles } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
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
  DialogTrigger,
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
import { formatFull } from "@/lib/dates";
import { ARTISTS, LABELS } from "@/lib/mock-data";

// Phase 1: Project Initiation (lean form for Promoters).
// Budget & Royalty Splits move to a later phase of the flow.

const formSchema = z.object({
  songTitle: z.string().min(1, "กรอกชื่อเพลง"),
  artist: z.string().min(1, "เลือกศิลปินจากรายชื่อ"),
  label: z.string().min(1, "เลือกสังกัด"),
  releaseDate: z.date({ message: "เลือกวันปล่อยเพลง" }),
});

export type NewProjectInput = z.infer<typeof formSchema>;

export function CreateProjectDialog({
  onCreate,
}: {
  onCreate: (values: NewProjectInput) => void;
}) {
  const [open, setOpen] = React.useState(false);

  const form = useForm<NewProjectInput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      songTitle: "",
      artist: "",
      label: "",
      releaseDate: undefined,
    },
  });

  const errors = form.formState.errors;

  function onSubmit(values: NewProjectInput) {
    onCreate(values);
    setOpen(false);
    form.reset();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) form.reset();
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus data-icon="inline-start" />
          Create Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Initiate New Release (Phase 1)</DialogTitle>
          <DialogDescription>
            ข้อมูลตั้งต้นโปรเจกต์ — ระบบจะ Generate Workback Timeline ให้ทันที
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6"
          noValidate
        >
          <FieldGroup>
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

            <Field data-invalid={!!errors.artist}>
              <FieldLabel>Artist Name</FieldLabel>
              <Controller
                control={form.control}
                name="artist"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      className="w-full"
                      aria-invalid={!!errors.artist}
                    >
                      <SelectValue placeholder="เลือกศิลปิน" />
                    </SelectTrigger>
                    <SelectContent>
                      {ARTISTS.map((artist) => (
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

            <Field data-invalid={!!errors.label}>
              <FieldLabel>Label</FieldLabel>
              <Controller
                control={form.control}
                name="label"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
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
                        disabled={{ before: new Date() }}
                        autoFocus
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
              <FieldError errors={[errors.releaseDate]} />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">
              <Sparkles data-icon="inline-start" />
              Create Project & Generate Timeline
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
