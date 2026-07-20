"use client";

import { Copy, ExternalLink, FolderOpen } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TASK_GROUPS } from "@/lib/mock-data";
import type { Project, Task } from "@/lib/types";

async function copyLink(url: string) {
  try {
    await navigator.clipboard.writeText(url);
    toast.success("คัดลอกลิงก์แล้ว");
  } catch {
    // Fallback for restricted clipboard contexts (e.g. some iframes)
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

export function AssetHubDialog({
  project,
  tasks,
  onOpenChange,
}: {
  project: Project | null;
  tasks: Task[];
  onOpenChange: (open: boolean) => void;
}) {
  const linked = project
    ? tasks.filter(
        (t) => t.projectId === project.id && (t.assetUrl ?? "").trim() !== ""
      )
    : [];

  // Group linked tasks by category (known categories first, then any extras)
  const categories = [
    ...TASK_GROUPS.filter((g) => linked.some((t) => t.group === g)),
    ...[...new Set(linked.map((t) => t.group))].filter(
      (g) => !TASK_GROUPS.includes(g)
    ),
  ];

  return (
    <Dialog open={!!project} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="size-5 text-muted-foreground" />
            {project?.songName} — Asset Hub
          </DialogTitle>
          <DialogDescription>
            ลิงก์งานที่ส่งมอบแล้วทั้งหมดของโปรเจกต์นี้ · {linked.length} รายการ
          </DialogDescription>
        </DialogHeader>

        {linked.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-12 text-center">
            <FolderOpen className="size-8 text-muted-foreground/40" />
            <p className="text-sm font-medium">ยังไม่มีลิงก์งาน</p>
            <p className="max-w-xs text-xs text-muted-foreground">
              เพิ่มลิงก์ที่ช่อง Asset ในแต่ละงานย่อย แล้วลิงก์จะมารวมที่นี่
            </p>
          </div>
        ) : (
          <div className="max-h-[60vh] space-y-4 overflow-y-auto">
            {categories.map((category) => {
              const items = linked.filter((t) => t.group === category);
              return (
                <div key={category}>
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground">
                      {category}
                    </span>
                    <Badge variant="secondary" className="tabular-nums">
                      {items.length}
                    </Badge>
                  </div>
                  <div className="divide-y rounded-lg border">
                    {items.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center gap-2 px-3 py-2"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">
                            {task.name}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">
                            {task.assetUrl}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="shrink-0"
                          onClick={() => copyLink(task.assetUrl ?? "")}
                        >
                          <Copy data-icon="inline-start" />
                          Copy Link
                        </Button>
                        <Button
                          asChild
                          variant="ghost"
                          size="icon"
                          className="shrink-0 text-muted-foreground"
                          aria-label={`เปิดลิงก์ ${task.name}`}
                        >
                          <a
                            href={task.assetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink />
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
