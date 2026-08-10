"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Cloud,
  Copy,
  Disc3,
  ExternalLink,
  HardDrive,
  Library,
  Mic2,
  PackageOpen,
  Search,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatFull, parseDate } from "@/lib/dates";
import type { Project, ProjectAsset } from "@/lib/types";
import { UserMenu } from "@/components/auth/user-menu";

/** A cloud URL (openable) vs a plain offline storage path (copy-only). */
const isHttp = (s?: string) =>
  !!s && s.trim().toLowerCase().startsWith("http");

/** Sort strings the way a Thai catalog reads: ก-ฮ then A-Z. */
const byName = (a: string, b: string) =>
  a.localeCompare(b, ["th", "en"], { sensitivity: "base" });

/** Fallback bucket names for release data that has no label / artist set. */
const NO_LABEL = "ไม่ระบุสังกัด";
const NO_ARTIST = "ไม่ระบุศิลปิน";

// Label accent — mirrors the Kanban card colors so a label reads the same
// everywhere. Unknown labels fall back to a neutral dot.
const LABEL_ACCENT: Record<string, { dot: string; text: string }> = {
  BRIDGE: { dot: "bg-blue-500", text: "text-blue-700 dark:text-blue-400" },
  MACHg: { dot: "bg-violet-500", text: "text-violet-700 dark:text-violet-400" },
  "9Arkkhan": { dot: "bg-amber-500", text: "text-amber-700 dark:text-amber-500" },
};

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

type ProjectNode = { project: Project; assets: ProjectAsset[] };
type ArtistNode = { artist: string; projects: ProjectNode[] };
type LabelNode = {
  label: string;
  artists: ArtistNode[];
  projectCount: number;
  assetCount: number;
};

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
  // Project rows are collapsed by default; this set holds the ids the user has
  // manually opened. An active search overrides it (everything shown expands).
  const [openProjects, setOpenProjects] = React.useState<Set<string>>(
    () => new Set()
  );

  const toggleProject = (id: string) =>
    setOpenProjects((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const projectById = React.useMemo(() => {
    const m = new Map<string, Project>();
    projects.forEach((p) => m.set(p.id, p));
    return m;
  }, [projects]);

  const q = query.trim().toLowerCase();
  const searching = q.length > 0;

  // Build the catalog tree: Label → Artist (ก-ฮ / A-Z) → Project (newest
  // release first). Assets are filtered by the search query first, so empty
  // branches never appear.
  const labels = React.useMemo<LabelNode[]>(() => {
    // 1. Group the (filtered) assets under their project.
    const assetsByProject = new Map<string, ProjectAsset[]>();
    for (const a of officialAssets) {
      const p = projectById.get(a.projectId);
      if (!p) continue; // orphaned asset (project deleted)
      if (q) {
        const haystack =
          `${p.songName} ${p.artistName} ${p.label} ${a.note} ${a.category}`.toLowerCase();
        if (!haystack.includes(q)) continue;
      }
      if (!assetsByProject.has(a.projectId))
        assetsByProject.set(a.projectId, []);
      assetsByProject.get(a.projectId)!.push(a);
    }

    // 2. Bucket the surviving projects into Label → Artist.
    const labelMap = new Map<string, Map<string, ProjectNode[]>>();
    for (const [pid, assets] of assetsByProject) {
      const project = projectById.get(pid)!;
      const label = project.label?.trim() || NO_LABEL;
      const artist = project.artistName?.trim() || NO_ARTIST;
      if (!labelMap.has(label)) labelMap.set(label, new Map());
      const artistMap = labelMap.get(label)!;
      if (!artistMap.has(artist)) artistMap.set(artist, []);
      artistMap.get(artist)!.push({ project, assets });
    }

    // 3. Sort every level and shape into the render tree.
    return [...labelMap.keys()].toSorted(byName).map((label) => {
      const artistMap = labelMap.get(label)!;
      const artists = [...artistMap.keys()].toSorted(byName).map((artist) => {
        const projectsForArtist = artistMap
          .get(artist)!
          // Newest release first — reads like a label timeline.
          .toSorted((a, b) =>
            b.project.releaseDate.localeCompare(a.project.releaseDate)
          );
        return { artist, projects: projectsForArtist };
      });
      const projectCount = artists.reduce((n, a) => n + a.projects.length, 0);
      const assetCount = artists.reduce(
        (n, a) => n + a.projects.reduce((m, p) => m + p.assets.length, 0),
        0
      );
      return { label, artists, projectCount, assetCount };
    });
  }, [officialAssets, projectById, q]);

  const totals = React.useMemo(() => {
    let assets = 0;
    let songs = 0;
    for (const l of labels) {
      assets += l.assetCount;
      songs += l.projectCount;
    }
    return { assets, songs, labels: labels.length };
  }, [labels]);

  const renderAssetRow = (asset: ProjectAsset) => {
    const dest = asset.officialDriveLink ?? "";
    const url = isHttp(dest);
    return (
      <div key={asset.id} className="flex items-start gap-2 px-3 py-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="truncate text-sm font-medium">
              {asset.note || "(ไม่มีชื่อ)"}
            </span>
            <Badge variant="outline">{asset.category}</Badge>
            {url && (
              <span
                title="อยู่บน Cloud / Official Drive"
                className="text-emerald-600 dark:text-emerald-400"
              >
                <Cloud className="size-3.5" />
              </span>
            )}
            {asset.isBackedUpLocal && (
              <span
                title="สำรองลง Local HDD/SSD แล้ว"
                className="text-indigo-600 dark:text-indigo-400"
              >
                <HardDrive className="size-3.5" />
              </span>
            )}
          </div>
          {dest && (
            <div className="mt-0.5 break-all text-xs text-muted-foreground">
              {url ? dest : `📁 ${dest}`}
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!dest}
            onClick={() => dest && copyLink(dest)}
          >
            <Copy data-icon="inline-start" />
            {url ? "Copy Link" : "Copy Path"}
          </Button>
          {url && (
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="text-muted-foreground"
              aria-label={`เปิด ${asset.note || "asset"}`}
            >
              <a href={dest} target="_blank" rel="noopener noreferrer">
                <ExternalLink />
              </a>
            </Button>
          )}
        </div>
      </div>
    );
  };

  const renderProjectRow = ({ project, assets }: ProjectNode) => {
    const open = searching || openProjects.has(project.id);
    const released = project.releaseDate
      ? formatFull(parseDate(project.releaseDate))
      : "ไม่ระบุวันปล่อย";
    return (
      <div key={project.id} className="overflow-hidden rounded-lg border">
        <button
          type="button"
          onClick={() => toggleProject(project.id)}
          aria-expanded={open}
          className="flex w-full items-center gap-2 bg-muted/40 px-3 py-2 text-left transition-colors hover:bg-muted/70"
        >
          {open ? (
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          )}
          <Disc3 className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate text-sm font-medium">
            {project.songName}
          </span>
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {released}
          </span>
          <Badge variant="secondary" className="ml-auto shrink-0 tabular-nums">
            {assets.length}
          </Badge>
        </button>
        {open && (
          <div className="divide-y border-t">{assets.map(renderAssetRow)}</div>
        )}
      </div>
    );
  };

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
                แคตตาล็อกไฟล์ที่เข้า Official Drive แล้ว — จัดกลุ่มตามสังกัด › ศิลปิน › เพลง
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
      ) : labels.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-16 text-center">
          <Search className="size-8 text-muted-foreground/40" />
          <p className="text-sm font-medium">ไม่พบผลลัพธ์</p>
          <p className="text-xs text-muted-foreground">ลองค้นด้วยคำอื่น</p>
        </div>
      ) : (
        <div className="space-y-8">
          <p className="text-sm text-muted-foreground">
            {totals.assets} asset{totals.assets === 1 ? "" : "s"} ·{" "}
            {totals.songs} song{totals.songs === 1 ? "" : "s"} · {totals.labels}{" "}
            label{totals.labels === 1 ? "" : "s"}
          </p>

          {labels.map(({ label, artists, projectCount, assetCount }) => {
            const accent = LABEL_ACCENT[label];
            return (
              <section key={label} className="space-y-4">
                {/* Level 1 — Label */}
                <div className="flex items-center gap-2.5 border-b pb-2">
                  <span
                    className={cn(
                      "size-3 shrink-0 rounded-full",
                      accent?.dot ?? "bg-muted-foreground/40"
                    )}
                  />
                  <h2
                    className={cn(
                      "text-lg font-bold tracking-tight",
                      accent?.text
                    )}
                  >
                    {label}
                  </h2>
                  <span className="ml-auto shrink-0 text-xs tabular-nums text-muted-foreground">
                    {projectCount} song{projectCount === 1 ? "" : "s"} ·{" "}
                    {assetCount} asset{assetCount === 1 ? "" : "s"}
                  </span>
                </div>

                <div className="space-y-5 pl-1 sm:pl-4">
                  {artists.map(({ artist, projects: artistProjects }) => (
                    <div key={artist} className="space-y-2">
                      {/* Level 2 — Artist */}
                      <div className="flex items-center gap-2">
                        <Mic2 className="size-4 shrink-0 text-muted-foreground" />
                        <h3 className="text-sm font-semibold">{artist}</h3>
                        <span className="text-xs tabular-nums text-muted-foreground">
                          · {artistProjects.length}
                        </span>
                      </div>
                      {/* Level 3 — Projects (collapsible) */}
                      <div className="space-y-2">
                        {artistProjects.map(renderProjectRow)}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
