"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Copy,
  Disc3,
  ExternalLink,
  HardDrive,
  Library,
  PackageOpen,
  Search,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Project, ProjectAsset } from "@/lib/types";
import { UserMenu } from "@/components/auth/user-menu";

async function copyLink(url: string) {
  try {
    await navigator.clipboard.writeText(url);
    toast.success("คัดลอกลิงก์แล้ว");
  } catch {
    try {
      const el = document.createElement("textarea");
      el.value = url;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      toast.success("คัดลอกลิงก์แล้ว");
    } catch {
      toast.error("คัดลอกไม่สำเร็จ");
    }
  }
}

export function LibraryMap({
  projects,
  officialAssets,
  userEmail,
}: {
  projects: Project[];
  officialAssets: ProjectAsset[];
  userEmail?: string | null;
}) {
  const [query, setQuery] = React.useState("");

  const projectById = React.useMemo(() => {
    const m = new Map<string, Project>();
    projects.forEach((p) => m.set(p.id, p));
    return m;
  }, [projects]);

  const q = query.trim().toLowerCase();

  // Group official assets by project, filtered by the search query.
  const groups = React.useMemo(() => {
    const byProject = new Map<string, ProjectAsset[]>();
    for (const a of officialAssets) {
      const p = projectById.get(a.projectId);
      if (!p) continue; // orphaned asset (project deleted)
      const haystack =
        `${p.songName} ${p.artistName} ${p.label} ${a.note} ${a.category}`.toLowerCase();
      if (q && !haystack.includes(q)) continue;
      if (!byProject.has(a.projectId)) byProject.set(a.projectId, []);
      byProject.get(a.projectId)!.push(a);
    }
    return projects
      .filter((p) => byProject.has(p.id))
      .map((p) => ({ project: p, assets: byProject.get(p.id)! }));
  }, [officialAssets, projectById, projects, q]);

  const totalShown = groups.reduce((n, g) => n + g.assets.length, 0);

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
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-foreground text-background">
              <Library className="size-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                Library Map
              </h1>
              <p className="text-sm text-muted-foreground">
                ไฟล์ที่ย้ายเข้า Official Drive แล้วของทุกโปรเจกต์ — สำหรับทีม Digital / Admin
              </p>
            </div>
          </div>
          <UserMenu email={userEmail ?? null} />
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาเพลง / ศิลปิน / สังกัด / ชื่อไฟล์ / หมวด…"
            className="pl-9"
          />
        </div>
      </header>

      {officialAssets.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-16 text-center">
          <PackageOpen className="size-8 text-muted-foreground/40" />
          <p className="text-sm font-medium">ยังไม่มีไฟล์ใน Official Drive</p>
          <p className="max-w-xs text-xs text-muted-foreground">
            เมื่อ Admin วางลิงก์ Official Google Drive ในหน้า Digital Library ไฟล์จะมาโผล่ที่นี่
          </p>
        </div>
      ) : groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-16 text-center">
          <Search className="size-8 text-muted-foreground/40" />
          <p className="text-sm font-medium">ไม่พบผลลัพธ์</p>
          <p className="text-xs text-muted-foreground">ลองค้นด้วยคำอื่น</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {totalShown} asset{totalShown === 1 ? "" : "s"} · {groups.length}{" "}
            project{groups.length === 1 ? "" : "s"}
          </p>
          {groups.map(({ project, assets }) => (
            <div key={project.id} className="overflow-hidden rounded-lg border">
              <div className="flex items-center justify-between gap-2 border-b bg-muted/40 px-3 py-2">
                <div className="flex min-w-0 items-center gap-2">
                  <Disc3 className="size-4 shrink-0 text-muted-foreground" />
                  <span className="truncate font-medium">
                    {project.songName}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {project.artistName} · {project.label}
                  </span>
                </div>
                <Badge variant="secondary" className="shrink-0 tabular-nums">
                  {assets.length}
                </Badge>
              </div>
              <div className="divide-y">
                {assets.map((asset) => (
                  <div
                    key={asset.id}
                    className="flex items-center gap-2 px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">
                          {asset.note || "(ไม่มีชื่อ)"}
                        </span>
                        <Badge variant="outline">{asset.category}</Badge>
                        {asset.isBackedUpLocal && (
                          <span
                            title="สำรองลง Local HDD/SSD แล้ว"
                            className="inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400"
                          >
                            <HardDrive className="size-3.5" />
                          </span>
                        )}
                      </div>
                      {asset.officialDriveLink && (
                        <div className="truncate text-xs text-muted-foreground">
                          {asset.officialDriveLink}
                        </div>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                      disabled={!asset.officialDriveLink}
                      onClick={() =>
                        asset.officialDriveLink &&
                        copyLink(asset.officialDriveLink)
                      }
                    >
                      <Copy data-icon="inline-start" />
                      Copy Link
                    </Button>
                    <Button
                      asChild={!!asset.officialDriveLink}
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "shrink-0 text-muted-foreground",
                        !asset.officialDriveLink && "pointer-events-none opacity-50"
                      )}
                      aria-label={`เปิด ${asset.note || "asset"}`}
                    >
                      {asset.officialDriveLink ? (
                        <a
                          href={asset.officialDriveLink}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink />
                        </a>
                      ) : (
                        <ExternalLink />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
