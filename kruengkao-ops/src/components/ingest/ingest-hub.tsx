"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ClipboardCheck,
  Disc3,
  ExternalLink,
  Inbox,
  Plus,
  RotateCcw,
  Send,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatFull, parseDate } from "@/lib/dates";
import {
  createProjectAsset,
  resubmitProjectAsset,
  reviewProjectAsset,
} from "@/app/actions";
import type { AssetStatus, Project, ProjectAsset } from "@/lib/types";

const PROVIDER_ROLES = ["Producer", "Promoter", "Graphics"];

const STATUS_STYLES: Record<AssetStatus, string> = {
  "Pending Review": "bg-amber-500/15 text-amber-700 dark:text-amber-500",
  Revision: "bg-red-500/15 text-red-700 dark:text-red-400",
  Vaulted: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
};

function AssetStatusBadge({ status }: { status: AssetStatus }) {
  return (
    <Badge className={cn("border-transparent", STATUS_STYLES[status])}>
      {status}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Submit / Resubmit dialog (creators)
// ---------------------------------------------------------------------------

function SubmitAssetDialog({
  open,
  onOpenChange,
  mode,
  asset,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "resubmit";
  asset?: ProjectAsset;
  onSubmit: (values: {
    providerRole: string;
    assetName: string;
    submittedLink: string;
    submitterNote: string;
  }) => Promise<void>;
}) {
  const isResubmit = mode === "resubmit";
  const [providerRole, setProviderRole] = React.useState(
    asset?.providerRole ?? ""
  );
  const [assetName, setAssetName] = React.useState(asset?.assetName ?? "");
  const [submittedLink, setSubmittedLink] = React.useState(
    isResubmit ? (asset?.submittedLink ?? "") : ""
  );
  const [submitterNote, setSubmitterNote] = React.useState(
    isResubmit ? (asset?.submitterNote ?? "") : ""
  );
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  async function handleSave() {
    if (!providerRole || !assetName.trim() || !submittedLink.trim()) {
      setError("กรอก Role, ชื่อ Asset และลิงก์ให้ครบ");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onSubmit({
        providerRole,
        assetName: assetName.trim(),
        submittedLink: submittedLink.trim(),
        submitterNote: submitterNote.trim(),
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
      <DialogContent className="sm:max-w-md" onCloseAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>
            {isResubmit ? "Resubmit Asset" : "Submit New Asset"}
          </DialogTitle>
          <DialogDescription>
            {isResubmit
              ? `แก้ไขและส่งใหม่ — เวอร์ชันจะเป็น v${(asset?.version ?? 1) + 1}`
              : "ส่งงานเข้าระบบเพื่อให้ทีม Digital รีวิว"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Provider Role</Label>
            {isResubmit ? (
              <div className="text-sm text-muted-foreground">{providerRole}</div>
            ) : (
              <Select value={providerRole} onValueChange={setProviderRole}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="เลือกทีมผู้ส่ง" />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDER_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="assetName">Asset Name</Label>
            {isResubmit ? (
              <div className="text-sm text-muted-foreground">{assetName}</div>
            ) : (
              <Input
                id="assetName"
                placeholder="เช่น MV, Master Audio Pack, Single Cover"
                value={assetName}
                onChange={(e) => setAssetName(e.target.value)}
              />
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="submittedLink">Submitted Link</Label>
            <Input
              id="submittedLink"
              placeholder="https://drive.google.com/…"
              value={submittedLink}
              onChange={(e) => setSubmittedLink(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="submitterNote">Note (optional)</Label>
            <Textarea
              id="submitterNote"
              placeholder="รายละเอียดเพิ่มเติมสำหรับผู้รีวิว…"
              value={submitterNote}
              onChange={(e) => setSubmitterNote(e.target.value)}
              rows={3}
            />
          </div>

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
            <Send data-icon="inline-start" />
            {saving ? "Submitting…" : isResubmit ? "Resubmit" : "Submit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Review dialog (digital team)
// ---------------------------------------------------------------------------

function ReviewAssetDialog({
  open,
  onOpenChange,
  asset,
  onReview,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: ProjectAsset | null;
  onReview: (
    id: string,
    input: { status: "Vaulted" | "Revision"; vaultLink: string; reviewerNote: string }
  ) => Promise<void>;
}) {
  const [vaultLink, setVaultLink] = React.useState(asset?.vaultLink ?? "");
  const [reviewerNote, setReviewerNote] = React.useState(
    asset?.reviewerNote ?? ""
  );
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState<null | "Vaulted" | "Revision">(
    null
  );

  if (!asset) return null;

  async function act(status: "Vaulted" | "Revision") {
    if (status === "Vaulted" && !vaultLink.trim()) {
      setError("ต้องใส่ Vault Link ก่อน Approve");
      return;
    }
    if (status === "Revision" && !reviewerNote.trim()) {
      setError("ใส่เหตุผล (Reviewer Note) ก่อนส่งกลับแก้");
      return;
    }
    setError(null);
    setSaving(status);
    try {
      await onReview(asset!.id, {
        status,
        vaultLink: vaultLink.trim(),
        reviewerNote: reviewerNote.trim(),
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "รีวิวไม่สำเร็จ");
    } finally {
      setSaving(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" onCloseAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="size-5 text-muted-foreground" />
            Review · {asset.assetName}
          </DialogTitle>
          <DialogDescription>
            {asset.providerRole} · v{asset.version}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/40 p-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Submitted link</span>
              {asset.submittedLink ? (
                <a
                  href={asset.submittedLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 font-medium text-blue-600 hover:underline dark:text-blue-400"
                >
                  เปิด <ExternalLink className="size-3.5" />
                </a>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </div>
            {asset.submitterNote && (
              <p className="mt-1.5 text-muted-foreground">
                “{asset.submitterNote}”
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="vaultLink">Vault Link (final)</Label>
            <Input
              id="vaultLink"
              placeholder="https://drive.google.com/… (ที่เก็บถาวร)"
              value={vaultLink}
              onChange={(e) => setVaultLink(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reviewerNote">Reviewer Note</Label>
            <Textarea
              id="reviewerNote"
              placeholder="ฟีดแบ็ก / เหตุผลที่ต้องแก้…"
              value={reviewerNote}
              onChange={(e) => setReviewerNote(e.target.value)}
              rows={3}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            className="text-red-600 hover:text-red-600 dark:text-red-400"
            disabled={!!saving}
            onClick={() => act("Revision")}
          >
            <RotateCcw data-icon="inline-start" />
            {saving === "Revision" ? "Saving…" : "Send to Revision"}
          </Button>
          <Button
            type="button"
            className="bg-emerald-600 text-white hover:bg-emerald-600/90"
            disabled={!!saving}
            onClick={() => act("Vaulted")}
          >
            <ShieldCheck data-icon="inline-start" />
            {saving === "Vaulted" ? "Saving…" : "Approve & Vault"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Ingest Hub
// ---------------------------------------------------------------------------

export function IngestHub({
  project,
  initialAssets,
}: {
  project: Project;
  initialAssets: ProjectAsset[];
}) {
  const [assets, setAssets] = React.useState<ProjectAsset[]>(initialAssets);
  const [submit, setSubmit] = React.useState<{
    mode: "create" | "resubmit";
    asset?: ProjectAsset;
  } | null>(null);
  const [reviewTarget, setReviewTarget] = React.useState<ProjectAsset | null>(
    null
  );

  const counts = {
    "Pending Review": assets.filter((a) => a.status === "Pending Review").length,
    Revision: assets.filter((a) => a.status === "Revision").length,
    Vaulted: assets.filter((a) => a.status === "Vaulted").length,
  };

  // Group by provider role (known roles first, then any others)
  const roles = [
    ...PROVIDER_ROLES.filter((r) => assets.some((a) => a.providerRole === r)),
    ...[...new Set(assets.map((a) => a.providerRole))].filter(
      (r) => !PROVIDER_ROLES.includes(r)
    ),
  ];

  async function handleCreate(values: {
    providerRole: string;
    assetName: string;
    submittedLink: string;
    submitterNote: string;
  }) {
    const created = await createProjectAsset({
      projectId: project.id,
      ...values,
    });
    setAssets((prev) => [created, ...prev]);
    toast.success("ส่ง Asset เข้าระบบแล้ว");
  }

  async function handleResubmit(
    id: string,
    values: { submittedLink: string; submitterNote: string }
  ) {
    const updated = await resubmitProjectAsset(id, values);
    setAssets((prev) => prev.map((a) => (a.id === id ? updated : a)));
    toast.success(`ส่งใหม่แล้ว (v${updated.version})`);
  }

  async function handleReview(
    id: string,
    input: { status: "Vaulted" | "Revision"; vaultLink: string; reviewerNote: string }
  ) {
    const updated = await reviewProjectAsset(id, input);
    setAssets((prev) => prev.map((a) => (a.id === id ? updated : a)));
    toast.success(
      input.status === "Vaulted" ? "Vaulted เรียบร้อย ✓" : "ส่งกลับให้แก้แล้ว"
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-6">
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
              <Inbox className="size-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                {project.songName} — Ingest Hub
              </h1>
              <p className="text-sm text-muted-foreground">
                {project.artistName} · {project.label} · ปล่อย{" "}
                {formatFull(parseDate(project.releaseDate))}
              </p>
            </div>
          </div>
          <Button onClick={() => setSubmit({ mode: "create" })}>
            <Plus data-icon="inline-start" />
            Submit Asset
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge className={cn("border-transparent", STATUS_STYLES["Pending Review"])}>
            Pending {counts["Pending Review"]}
          </Badge>
          <Badge className={cn("border-transparent", STATUS_STYLES.Revision)}>
            Revision {counts.Revision}
          </Badge>
          <Badge className={cn("border-transparent", STATUS_STYLES.Vaulted)}>
            Vaulted {counts.Vaulted}
          </Badge>
        </div>
      </header>

      {assets.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-16 text-center">
          <Inbox className="size-8 text-muted-foreground/40" />
          <p className="text-sm font-medium">ยังไม่มี Asset ในโปรเจกต์นี้</p>
          <p className="max-w-xs text-xs text-muted-foreground">
            กด “Submit Asset” เพื่อส่งงานชิ้นแรกเข้าระบบรีวิว
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {roles.map((role) => (
            <section key={role} className="space-y-2">
              <div className="flex items-center gap-2">
                <Disc3 className="size-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">{role}</h2>
                <span className="text-xs text-muted-foreground">
                  ({assets.filter((a) => a.providerRole === role).length})
                </span>
              </div>
              <div className="space-y-2">
                {assets
                  .filter((a) => a.providerRole === role)
                  .map((asset) => (
                    <div
                      key={asset.id}
                      className="rounded-lg border bg-background p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{asset.assetName}</span>
                          <Badge variant="outline" className="tabular-nums">
                            v{asset.version}
                          </Badge>
                          <AssetStatusBadge status={asset.status} />
                        </div>
                        <div className="flex items-center gap-1.5">
                          {asset.submittedLink && (
                            <Button
                              asChild
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground"
                            >
                              <a
                                href={asset.submittedLink}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink data-icon="inline-start" />
                                Submitted
                              </a>
                            </Button>
                          )}
                          {asset.status === "Vaulted" && asset.vaultLink && (
                            <Button
                              asChild
                              variant="outline"
                              size="sm"
                              className="text-emerald-700 dark:text-emerald-400"
                            >
                              <a
                                href={asset.vaultLink}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ShieldCheck data-icon="inline-start" />
                                Vault
                              </a>
                            </Button>
                          )}
                          {asset.status === "Revision" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setSubmit({ mode: "resubmit", asset })
                              }
                            >
                              <RotateCcw data-icon="inline-start" />
                              Resubmit
                            </Button>
                          )}
                          {asset.status !== "Vaulted" && (
                            <Button
                              size="sm"
                              onClick={() => setReviewTarget(asset)}
                            >
                              <ClipboardCheck data-icon="inline-start" />
                              Review
                            </Button>
                          )}
                        </div>
                      </div>
                      {(asset.submitterNote || asset.reviewerNote) && (
                        <div className="mt-2 space-y-1 border-t pt-2 text-xs">
                          {asset.submitterNote && (
                            <p className="text-muted-foreground">
                              <span className="font-medium text-foreground">
                                Submitter:
                              </span>{" "}
                              {asset.submitterNote}
                            </p>
                          )}
                          {asset.reviewerNote && (
                            <p className="text-muted-foreground">
                              <span className="font-medium text-foreground">
                                Reviewer:
                              </span>{" "}
                              {asset.reviewerNote}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Submit / Resubmit */}
      <SubmitAssetDialog
        key={submit ? `${submit.mode}-${submit.asset?.id ?? "new"}` : "closed"}
        open={!!submit}
        onOpenChange={(open) => {
          if (!open) setSubmit(null);
        }}
        mode={submit?.mode ?? "create"}
        asset={submit?.asset}
        onSubmit={
          submit?.mode === "resubmit" && submit.asset
            ? (v) =>
                handleResubmit(submit.asset!.id, {
                  submittedLink: v.submittedLink,
                  submitterNote: v.submitterNote,
                })
            : handleCreate
        }
      />

      {/* Review */}
      <ReviewAssetDialog
        key={reviewTarget?.id ?? "review-closed"}
        open={!!reviewTarget}
        onOpenChange={(open) => {
          if (!open) setReviewTarget(null);
        }}
        asset={reviewTarget}
        onReview={handleReview}
      />
    </div>
  );
}
