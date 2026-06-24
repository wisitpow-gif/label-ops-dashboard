"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Disc3,
  FolderSync,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { PROJECT_TYPES } from "@/lib/constants";
import {
  createTaskTemplate,
  deleteTaskTemplate,
  syncTemplateToProjects,
  updateTaskTemplate,
} from "@/app/actions";
import type { ProjectType, TaskTemplate } from "@/lib/types";
import {
  TemplateFormDialog,
  type TemplateFormValues,
} from "./template-form-dialog";

export function TemplatesManager({
  initialTemplates,
}: {
  initialTemplates: TaskTemplate[];
}) {
  const [templates, setTemplates] =
    React.useState<TaskTemplate[]>(initialTemplates);
  const [selectedType, setSelectedType] = React.useState<ProjectType>("Single");
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<TaskTemplate | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<TaskTemplate | null>(
    null
  );
  const [syncOpen, setSyncOpen] = React.useState(false);
  const [syncing, setSyncing] = React.useState(false);

  const rows = React.useMemo(
    () =>
      templates
        .filter((t) => t.projectType === selectedType)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [templates, selectedType]
  );

  async function handleCreate(values: TemplateFormValues) {
    const created = await createTaskTemplate({
      projectType: selectedType,
      ...values,
    });
    setTemplates((prev) => [...prev, created]);
    toast.success("เพิ่มงานในเทมเพลตแล้ว");
  }

  async function handleUpdate(values: TemplateFormValues) {
    if (!editTarget) return;
    const updated = await updateTaskTemplate(editTarget.id, {
      projectType: editTarget.projectType,
      ...values,
    });
    setTemplates((prev) =>
      prev.map((t) => (t.id === updated.id ? updated : t))
    );
    toast.success("บันทึกการแก้ไขแล้ว");
  }

  async function handleDelete(id: string) {
    try {
      await deleteTaskTemplate(id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      toast.success("ลบงานออกจากเทมเพลตแล้ว");
    } catch (err) {
      console.error("Failed to delete template", err);
      toast.error("ลบไม่สำเร็จ — ลองอีกครั้ง");
    }
  }

  async function handleSync() {
    setSyncing(true);
    try {
      const result = await syncTemplateToProjects(selectedType);
      setSyncOpen(false);
      if (result.projects === 0) {
        toast.info(`ไม่มีโปรเจกต์ ${selectedType} ที่ต้องอัปเดต`);
      } else {
        toast.success(`Synced to ${result.projects} project${result.projects === 1 ? "" : "s"}`, {
          description: `เพิ่ม ${result.inserted} งาน · อัปเดต ${result.updated} งาน (คงสถานะและผู้รับผิดชอบเดิม)`,
        });
      }
    } catch (err) {
      console.error("Sync failed", err);
      toast.error("Sync ไม่สำเร็จ — ลองอีกครั้ง");
    } finally {
      setSyncing(false);
    }
  }

  const editValues: TemplateFormValues | undefined = editTarget
    ? {
        taskName: editTarget.taskName,
        category: editTarget.category,
        role: editTarget.role,
        tMinusDays: editTarget.tMinusDays,
        durationDays: editTarget.durationDays,
      }
    : undefined;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-6">
      <header className="space-y-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          กลับสู่ Dashboard
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-foreground text-background">
            <Disc3 className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Workflow Templates
            </h1>
            <p className="text-sm text-muted-foreground">
              จัดการงานตั้งต้นของแต่ละ Project Type — ใช้ตอนสร้างโปรเจกต์ใหม่
            </p>
          </div>
        </div>
      </header>

      <Tabs
        value={selectedType}
        onValueChange={(v) => setSelectedType(v as ProjectType)}
      >
        <TabsList>
          {PROJECT_TYPES.map((type) => (
            <TabsTrigger key={type} value={type}>
              {type}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {rows.length} task{rows.length === 1 ? "" : "s"} in{" "}
          <span className="font-medium text-foreground">{selectedType}</span>
        </p>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSyncOpen(true)}
            disabled={rows.length === 0}
          >
            <FolderSync data-icon="inline-start" />
            Sync to Ongoing Projects
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus data-icon="inline-start" />
            Add Task
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-12">#</TableHead>
              <TableHead>Task Name</TableHead>
              <TableHead className="w-52">Category</TableHead>
              <TableHead className="w-40">Role</TableHead>
              <TableHead className="w-24 text-right">T-Minus</TableHead>
              <TableHead className="w-24 text-right">Duration</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={7}
                  className="py-12 text-center text-sm text-muted-foreground"
                >
                  ยังไม่มีงานในเทมเพลตนี้ — กด “Add Task” เพื่อเริ่ม
                </TableCell>
              </TableRow>
            )}
            {rows.map((t, i) => (
              <TableRow key={t.id}>
                <TableCell className="text-sm tabular-nums text-muted-foreground">
                  {i + 1}
                </TableCell>
                <TableCell className="font-medium">{t.taskName}</TableCell>
                <TableCell>
                  <Badge variant="outline">{t.category}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {t.role}
                </TableCell>
                <TableCell className="text-right text-sm tabular-nums">
                  T-{t.tMinusDays}
                </TableCell>
                <TableCell className="text-right text-sm tabular-nums">
                  {t.durationDays}d
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-muted-foreground"
                        aria-label="เมนูจัดการงาน"
                      >
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onSelect={() => setTimeout(() => setEditTarget(t), 0)}
                      >
                        <Pencil />
                        Edit Task
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onSelect={() => setTimeout(() => setDeleteTarget(t), 0)}
                      >
                        <Trash2 />
                        Delete Task
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Create */}
      <TemplateFormDialog
        mode="create"
        open={createOpen}
        onOpenChange={setCreateOpen}
        projectType={selectedType}
        onSubmit={handleCreate}
      />

      {/* Edit */}
      <TemplateFormDialog
        key={editTarget?.id ?? "edit"}
        mode="edit"
        open={!!editTarget}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
        projectType={editTarget?.projectType ?? selectedType}
        values={editValues}
        onSubmit={handleUpdate}
      />

      {/* Sync */}
      <AlertDialog
        open={syncOpen}
        onOpenChange={(open) => {
          if (!syncing) setSyncOpen(open);
        }}
      >
        <AlertDialogContent onCloseAutoFocus={(e) => e.preventDefault()}>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Sync “{selectedType}” template to ongoing projects?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Every {selectedType} project gets any missing tasks added, and the
              T-minus, duration, and role of existing tasks updated to match this
              template. Task <strong>status</strong> and{" "}
              <strong>assignees</strong> are never changed, and no tasks are
              deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={syncing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={syncing}
              onClick={(e) => {
                // keep dialog open during the async work; close in handler
                e.preventDefault();
                handleSync();
              }}
            >
              {syncing ? (
                <>
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                  Syncing…
                </>
              ) : (
                "Sync now"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent onCloseAutoFocus={(e) => e.preventDefault()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this task template?</AlertDialogTitle>
            <AlertDialogDescription>
              “{deleteTarget?.taskName}” will be removed from the{" "}
              {deleteTarget?.projectType} workflow. Existing projects are not
              affected — only future projects of this type.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={cn(
                buttonVariants({ variant: "destructive" }),
                "bg-destructive text-white hover:bg-destructive/90"
              )}
              onClick={() => {
                if (deleteTarget) handleDelete(deleteTarget.id);
                setDeleteTarget(null);
              }}
            >
              Delete Task
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
