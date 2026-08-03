"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Pencil, Plus, Trash2, Users } from "lucide-react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";
import { TEAM_ROLES, toRoleGroups } from "@/lib/team";
import { initialsOf } from "@/lib/mock-data";
import type { TeamMember } from "@/lib/types";
import { UserMenu } from "@/components/auth/user-menu";
import {
  createTeamMember,
  deleteTeamMember,
  updateTeamMember,
} from "@/app/actions";

const ROLE_DOT: Record<string, string> = {
  Promoter: "bg-blue-500",
  "Creative/MarCom": "bg-pink-500",
  Graphics: "bg-violet-500",
  Producer: "bg-emerald-500",
  Digital: "bg-amber-500",
  Distributor: "bg-cyan-500",
};

type DialogState =
  | { mode: "create" }
  | { mode: "edit"; member: TeamMember }
  | null;

/** Add/Edit dialog — name + role. Keyed by the editing member so it re-inits. */
function MemberDialog({
  state,
  onOpenChange,
  onSubmit,
}: {
  state: DialogState;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: { name: string; role: string }) => Promise<void>;
}) {
  const editing = state?.mode === "edit" ? state.member : null;
  const [name, setName] = React.useState(editing?.name ?? "");
  const [role, setRole] = React.useState(editing?.role ?? TEAM_ROLES[0]);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("กรอกชื่อสมาชิก");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit({ name: name.trim(), role });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={state !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {editing ? "แก้ไขสมาชิก" : "เพิ่มสมาชิกทีม"}
          </DialogTitle>
          <DialogDescription>
            ชื่อและแผนก (Role) ของสมาชิก — ใช้ในการมอบหมายงาน
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="member-name">ชื่อ</Label>
            <Input
              id="member-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น Pakbung"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="w-full">
                <SelectValue />
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
              {saving ? "Saving…" : editing ? "Save Changes" : "Add Member"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function TeamSettings({
  initialMembers,
  userEmail,
}: {
  initialMembers: TeamMember[];
  userEmail?: string | null;
}) {
  const [members, setMembers] = React.useState<TeamMember[]>(initialMembers);
  const [dialog, setDialog] = React.useState<DialogState>(null);
  const [toDelete, setToDelete] = React.useState<TeamMember | null>(null);

  const groups = React.useMemo(() => toRoleGroups(members), [members]);

  async function handleSubmit(values: { name: string; role: string }) {
    if (dialog?.mode === "edit") {
      const updated = await updateTeamMember({
        id: dialog.member.id,
        ...values,
      });
      setMembers((prev) =>
        prev.map((m) => (m.id === updated.id ? updated : m))
      );
      toast.success("บันทึกสมาชิกแล้ว");
    } else {
      const created = await createTeamMember(values);
      setMembers((prev) => [...prev, created]);
      toast.success("เพิ่มสมาชิกแล้ว");
    }
  }

  async function handleDelete() {
    if (!toDelete) return;
    const removed = toDelete;
    setToDelete(null);
    setMembers((prev) => prev.filter((m) => m.id !== removed.id));
    try {
      await deleteTeamMember(removed.id);
      toast.success("ลบสมาชิกแล้ว");
    } catch (err) {
      console.error("Failed to delete team member", err);
      setMembers((prev) => [...prev, removed]); // rollback
      toast.error("ลบไม่สำเร็จ — คืนค่าเดิมแล้ว");
    }
  }

  // Find each member's row (need the id for edit/delete) within a role group.
  const memberByRoleName = React.useMemo(() => {
    const m = new Map<string, TeamMember>();
    for (const mem of members) m.set(`${mem.role}::${mem.name}`, mem);
    return m;
  }, [members]);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <header className="space-y-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          กลับสู่ Dashboard
        </Link>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-foreground text-background">
              <Users className="size-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                Team Members
              </h1>
              <p className="text-sm text-muted-foreground">
                จัดการรายชื่อทีมงานและแผนก — ใช้ในการมอบหมายงานทุกที่
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setDialog({ mode: "create" })}>
              <Plus data-icon="inline-start" />
              Add Member
            </Button>
            <UserMenu email={userEmail ?? null} />
          </div>
        </div>
      </header>

      {members.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-16 text-center">
          <Users className="size-8 text-muted-foreground/40" />
          <p className="text-sm font-medium">ยังไม่มีสมาชิกในทีม</p>
          <p className="max-w-xs text-xs text-muted-foreground">
            กด “Add Member” เพื่อเพิ่มคนแรก
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <section key={group.role} className="rounded-xl border">
              <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-2.5">
                <span
                  className={cn(
                    "size-2.5 shrink-0 rounded-full",
                    ROLE_DOT[group.role] ?? "bg-muted-foreground/40"
                  )}
                />
                <span className="text-sm font-semibold">{group.role}</span>
                <span className="ml-auto rounded-full bg-background px-2 text-xs tabular-nums text-muted-foreground">
                  {group.members.length}
                </span>
              </div>
              <ul className="divide-y">
                {group.members.map((personName) => {
                  const member = memberByRoleName.get(
                    `${group.role}::${personName}`
                  );
                  if (!member) return null;
                  return (
                    <li
                      key={member.id}
                      className="flex items-center gap-3 px-4 py-2.5"
                    >
                      <Avatar className="size-7">
                        <AvatarFallback className="text-xs">
                          {initialsOf(personName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{personName}</span>
                      <div className="ml-auto flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`แก้ไข ${personName}`}
                          onClick={() =>
                            setDialog({ mode: "edit", member })
                          }
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`ลบ ${personName}`}
                          onClick={() => setToDelete(member)}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      <MemberDialog
        key={dialog?.mode === "edit" ? dialog.member.id : "create"}
        state={dialog}
        onOpenChange={(open) => {
          if (!open) setDialog(null);
        }}
        onSubmit={handleSubmit}
      />

      <AlertDialog
        open={toDelete !== null}
        onOpenChange={(open) => {
          if (!open) setToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ลบสมาชิกคนนี้?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete
                ? `“${toDelete.name}” (${toDelete.role}) จะถูกลบออกจากรายชื่อทีม งานที่มอบหมายไว้แล้วจะยังคงอยู่`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={cn(buttonVariants({ variant: "destructive" }))}
              onClick={handleDelete}
            >
              ลบสมาชิก
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
