"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Cloud,
  CloudOff,
  Copy,
  ExternalLink,
  HardDrive,
  Import,
  Library,
  PackageOpen,
  Send,
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
import { Checkbox } from "@/components/ui/checkbox";
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
import { formatFull, parseDate } from "@/lib/dates";
import { ASSET_CATEGORIES } from "@/lib/constants";
import {
  createProjectAsset,
  deleteProjectAsset,
  setAssetLocalBackup,
  updateAssetOfficialLink,
} from "@/app/actions";
import type { Project, ProjectAsset } from "@/lib/types";
import { UserMenu } from "@/components/auth/user-menu";

/** A cloud URL (clickable) vs a plain offline storage path (copyable text). */
const isHttp = (s?: string) =>
  !!s && s.trim().toLowerCase().startsWith("http");

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("คัดลอกแล้ว");
  } catch {
    try {
      const el = document.createElement("textarea");
      el.value = text;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      toast.success("คัดลอกแล้ว");
    } catch {
      toast.error("คัดลอกไม่สำเร็จ");
    }
  }
}

// ---------------------------------------------------------------------------
// Quick Drop bar — as fast as sending a chat message
// ---------------------------------------------------------------------------

function QuickDropBar({
  onSubmit,
}: {
  onSubmit: (values: {
    sourceLink: string;
    note: string;
    category: string;
  }) => Promise<void>;
}) {
  const [sourceLink, setSourceLink] = React.useState("");
  const [note, setNote] = React.useState("");
  const [category, setCategory] = React.useState<string>(ASSET_CATEGORIES[0]);
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!sourceLink.trim()) {
      toast.error("วางลิงก์ก่อนส่ง");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        sourceLink: sourceLink.trim(),
        note: note.trim(),
        category,
      });
      setSourceLink("");
      setNote("");
      // keep the category selected for fast repeat drops
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ส่งไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 rounded-xl border bg-muted/30 p-3 sm:flex-row sm:items-center"
    >
      <Input
        value={sourceLink}
        onChange={(e) => setSourceLink(e.target.value)}
        placeholder="วางลิงก์ต้นทาง (Drive / Dropbox / WeTransfer…)"
        className="w-full min-w-0 bg-background sm:flex-1"
      />
      <Input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="โน้ต / ชื่อไฟล์"
        className="w-full bg-background sm:w-48"
      />
      <Select value={category} onValueChange={setCategory}>
        <SelectTrigger className="w-full bg-background sm:w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ASSET_CATEGORIES.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button type="submit" disabled={submitting}>
        <Send data-icon="inline-start" />
        {submitting ? "Sending…" : "Submit"}
      </Button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Asset card — source link + official drive link + dual storage tracking
// ---------------------------------------------------------------------------

function AssetCard({
  asset,
  onSaveOfficial,
  onToggleLocal,
  onDelete,
}: {
  asset: ProjectAsset;
  onSaveOfficial: (id: string, link: string) => Promise<void>;
  onToggleLocal: (id: string, value: boolean) => Promise<void>;
  onDelete: (asset: ProjectAsset) => void;
}) {
  const [link, setLink] = React.useState(asset.officialDriveLink ?? "");
  const [savingLink, setSavingLink] = React.useState(false);
  const [togglingLocal, setTogglingLocal] = React.useState(false);

  const official = asset.officialDriveLink ?? "";
  const hasOfficial = !!official;
  const cloud = hasOfficial && isHttp(official);
  const offlinePath = hasOfficial && !cloud;
  const dirty = link.trim() !== official;

  async function saveLink() {
    setSavingLink(true);
    try {
      await onSaveOfficial(asset.id, link);
    } finally {
      setSavingLink(false);
    }
  }

  async function toggleLocal() {
    setTogglingLocal(true);
    try {
      await onToggleLocal(asset.id, !asset.isBackedUpLocal);
    } finally {
      setTogglingLocal(false);
    }
  }

  return (
    <div className="min-w-0 space-y-2.5 overflow-hidden rounded-lg border bg-background p-3">
      {/* Note + source link + delete */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">
            {asset.note || "(ไม่มีชื่อ)"}
          </div>
          {asset.sourceLink ? (
            <a
              href={asset.sourceLink}
              target="_blank"
              rel="noopener noreferrer"
              title={asset.sourceLink}
              className="mt-0.5 block whitespace-normal break-all text-xs text-blue-600 hover:underline dark:text-blue-400"
            >
              <ExternalLink className="mr-1 inline size-3 align-[-1px]" />
              Source: {asset.sourceLink}
            </a>
          ) : (
            <span className="text-xs text-muted-foreground">
              ไม่มีลิงก์ต้นทาง
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
          aria-label="ลบ Asset"
          onClick={() => onDelete(asset)}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      {/* Official Google Drive link (admin) */}
      <div className="flex items-center gap-2">
        <Input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="ลิงก์ Official Drive หรือ path ในไดรฟ์ (เช่น [HDD-04] /2023/…)"
          className="h-8 min-w-0 flex-1"
        />
        <Button
          size="sm"
          variant={dirty ? "default" : "outline"}
          disabled={savingLink || !dirty}
          onClick={saveLink}
          className="shrink-0"
        >
          {savingLink ? "…" : "Save"}
        </Button>
      </div>

      {/* Dual storage tracking */}
      <div className="flex flex-wrap items-center gap-2">
        {!hasOfficial && (
          <Badge className="gap-1 border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-500">
            <CloudOff className="size-3" />
            Pending Verification
          </Badge>
        )}
        {cloud && (
          <>
            <Badge className="gap-1 border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
              <Cloud className="size-3" />
              Moved to Official Drive
            </Badge>
            <a
              href={official}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:underline dark:text-emerald-400"
            >
              เปิด <ExternalLink className="size-3" />
            </a>
          </>
        )}
        {offlinePath && (
          <>
            <Badge className="gap-1 border-transparent bg-indigo-500/15 text-indigo-700 dark:text-indigo-400">
              <HardDrive className="size-3" />
              Offline Path
            </Badge>
            <button
              type="button"
              onClick={() => copyText(official)}
              className="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-muted"
            >
              <Copy className="size-3" /> Copy Path
            </button>
          </>
        )}

        <button
          type="button"
          onClick={toggleLocal}
          disabled={togglingLocal}
          aria-pressed={asset.isBackedUpLocal}
          className={cn(
            "ml-auto inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-medium transition-colors disabled:opacity-50",
            asset.isBackedUpLocal
              ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
              : "text-muted-foreground hover:bg-muted"
          )}
        >
          {asset.isBackedUpLocal ? (
            <CheckCircle2 className="size-3.5" />
          ) : (
            <HardDrive className="size-3.5" />
          )}
          Local HDD/SSD
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Admin Direct Add — backfill a fully-processed (legacy) asset in one step
// ---------------------------------------------------------------------------

function AdminAddDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: {
    category: string;
    note: string;
    officialDriveLink: string;
    isBackedUpLocal: boolean;
  }) => Promise<void>;
}) {
  const [category, setCategory] = React.useState<string>(ASSET_CATEGORIES[0]);
  const [note, setNote] = React.useState("");
  const [official, setOfficial] = React.useState("");
  const [local, setLocal] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSave() {
    if (!official.trim()) {
      setError("ใส่ลิงก์ปลายทาง หรือ path ในไดรฟ์");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        category,
        note: note.trim(),
        officialDriveLink: official.trim(),
        isBackedUpLocal: local,
      });
      onOpenChange(false);
      setNote("");
      setOfficial("");
      setLocal(true);
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
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Admin Direct Add (Legacy)</DialogTitle>
          <DialogDescription>
            เพิ่มไฟล์ที่ผ่านการตรวจแล้วโดยตรง — ข้ามขั้นตอน source link (สำหรับ backfill งานเก่า)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASSET_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="admin-note">Name / Note</Label>
            <Input
              id="admin-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="เช่น Master Audio v2"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="admin-official">Official Link / Path</Label>
            <Input
              id="admin-official"
              value={official}
              onChange={(e) => setOfficial(e.target.value)}
              placeholder="https://drive… หรือ [HDD-04] /2023_Releases/…"
            />
            <p className="text-xs text-muted-foreground">
              รองรับทั้งลิงก์คลาวด์ และ path ของไดรฟ์ออฟไลน์
            </p>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox
              checked={local}
              onCheckedChange={(v) => setLocal(v === true)}
            />
            สำรองลง Local HDD/SSD แล้ว
          </label>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="ghost" disabled={saving}>
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleSave} disabled={saving}>
            <Import data-icon="inline-start" />
            {saving ? "Adding…" : "Add to Library"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Digital Library (per project)
// ---------------------------------------------------------------------------

export function DigitalLibrary({
  project,
  initialAssets,
  userEmail,
}: {
  project: Project;
  initialAssets: ProjectAsset[];
  userEmail?: string | null;
}) {
  const [assets, setAssets] = React.useState<ProjectAsset[]>(initialAssets);
  const [deleteTarget, setDeleteTarget] = React.useState<ProjectAsset | null>(
    null
  );
  const [adminOpen, setAdminOpen] = React.useState(false);

  const officialCount = assets.filter((a) => a.officialDriveLink).length;
  const localCount = assets.filter((a) => a.isBackedUpLocal).length;

  // Group by category — known categories first, then any extras (e.g. legacy).
  const categories = [
    ...ASSET_CATEGORIES.filter((c) => assets.some((a) => a.category === c)),
    ...[...new Set(assets.map((a) => a.category))].filter(
      (c) => !(ASSET_CATEGORIES as readonly string[]).includes(c)
    ),
  ];

  async function handleQuickDrop(values: {
    sourceLink: string;
    note: string;
    category: string;
  }) {
    const created = await createProjectAsset({
      projectId: project.id,
      ...values,
    });
    setAssets((prev) => [created, ...prev]);
    toast.success("บันทึกลงคลังแล้ว");
  }

  async function handleAdminAdd(values: {
    category: string;
    note: string;
    officialDriveLink: string;
    isBackedUpLocal: boolean;
  }) {
    const created = await createProjectAsset({
      projectId: project.id,
      ...values,
    });
    setAssets((prev) => [created, ...prev]);
    toast.success("เพิ่มไฟล์ (Legacy) แล้ว");
  }

  async function handleSaveOfficial(id: string, link: string) {
    try {
      const updated = await updateAssetOfficialLink(id, link);
      setAssets((prev) => prev.map((a) => (a.id === id ? updated : a)));
      toast.success(
        updated.officialDriveLink ? "ย้ายเข้า Official Drive แล้ว ✓" : "ล้างลิงก์แล้ว"
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
    }
  }

  async function handleToggleLocal(id: string, value: boolean) {
    // Optimistic — the toggle should feel instant.
    setAssets((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isBackedUpLocal: value } : a))
    );
    try {
      await setAssetLocalBackup(id, value);
    } catch (err) {
      setAssets((prev) =>
        prev.map((a) => (a.id === id ? { ...a, isBackedUpLocal: !value } : a))
      );
      toast.error(err instanceof Error ? err.message : "อัปเดตไม่สำเร็จ");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteProjectAsset(id);
      setAssets((prev) => prev.filter((a) => a.id !== id));
      toast.success("ลบ Asset แล้ว");
    } catch (err) {
      console.error("Failed to delete asset", err);
      toast.error("ลบไม่สำเร็จ — ลองอีกครั้ง");
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-6">
      <header className="space-y-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          กลับสู่ Dashboard
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-foreground text-background">
              <Library className="size-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                {project.songName} — Digital Library
              </h1>
              <p className="text-sm text-muted-foreground">
                {project.artistName} · {project.label} · ปล่อย{" "}
                {formatFull(parseDate(project.releaseDate))}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <Cloud className="size-3" /> {officialCount}/{assets.length} Official
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <HardDrive className="size-3" /> {localCount} Local
            </Badge>
            <UserMenu email={userEmail ?? null} />
          </div>
        </div>
      </header>

      {/* Quick Drop + Admin backfill */}
      <div className="space-y-2">
        <QuickDropBar onSubmit={handleQuickDrop} />
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => setAdminOpen(true)}
          >
            <Import data-icon="inline-start" />
            Admin Direct Add (Legacy)
          </Button>
        </div>
      </div>

      {assets.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-16 text-center">
          <PackageOpen className="size-8 text-muted-foreground/40" />
          <p className="text-sm font-medium">ยังไม่มีไฟล์ในคลัง</p>
          <p className="max-w-xs text-xs text-muted-foreground">
            วางลิงก์ในแถบด้านบนแล้วกด Submit — เร็วเหมือนส่งแชท
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {categories.map((category) => {
            const items = assets.filter((a) => a.category === category);
            return (
              <section key={category} className="space-y-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold">{category}</h2>
                  <span className="rounded-full bg-muted px-2 text-xs tabular-nums text-muted-foreground">
                    {items.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  {items.map((asset) => (
                    <AssetCard
                      key={asset.id}
                      asset={asset}
                      onSaveOfficial={handleSaveOfficial}
                      onToggleLocal={handleToggleLocal}
                      onDelete={setDeleteTarget}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Admin Direct Add (Legacy import) */}
      <AdminAddDialog
        open={adminOpen}
        onOpenChange={setAdminOpen}
        onSubmit={handleAdminAdd}
      />

      {/* Delete */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent onCloseAutoFocus={(e) => e.preventDefault()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this asset?</AlertDialogTitle>
            <AlertDialogDescription>
              “{deleteTarget?.note || "(ไม่มีชื่อ)"}” ({deleteTarget?.category})
              will be permanently removed from this project. This cannot be
              undone.
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
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
