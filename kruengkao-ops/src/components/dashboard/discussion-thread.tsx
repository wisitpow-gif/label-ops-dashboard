"use client";

import * as React from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/dates";
import { initialsOf } from "@/lib/mock-data";
import { createTaskComment, getTaskComments } from "@/app/actions";
import type { TaskComment } from "@/lib/types";

/** A comment plus an optimistic "not yet persisted" flag. */
interface UIComment extends TaskComment {
  pending?: boolean;
}

/**
 * Scrollable discussion feed + composer for one task. Loads the thread on
 * mount, posts optimistically (Enter to send, Shift+Enter for a newline), and
 * keeps the feed pinned to the newest message.
 */
export function DiscussionThread({
  taskId,
  currentAuthor,
}: {
  taskId: string;
  /** Display name used for the optimistic bubble before the server responds. */
  currentAuthor: string;
}) {
  const [comments, setComments] = React.useState<UIComment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [text, setText] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Load the thread once (the dialog is keyed per task, so we remount fresh).
  React.useEffect(() => {
    let active = true;
    getTaskComments(taskId)
      .then((c) => {
        if (active) {
          setComments(c);
          setLoading(false);
        }
      })
      .catch((err) => {
        // A missing table / wrong DB / RLS read block shows up here.
        console.error("[DiscussionThread] getTaskComments failed:", err);
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [taskId]);

  // Auto-scroll to the newest comment on load and whenever one is added.
  React.useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [comments.length, loading]);

  async function submit() {
    const content = text.trim();
    if (!content || sending) return;

    const tempId = crypto.randomUUID();
    const optimistic: UIComment = {
      id: tempId,
      taskId,
      authorName: currentAuthor,
      content,
      createdAt: new Date().toISOString(),
      pending: true,
    };
    setComments((prev) => [...prev, optimistic]);
    setText("");
    setSending(true);

    const rollback = () => {
      setComments((prev) => prev.filter((c) => c.id !== tempId));
      setText(content); // restore the draft so it isn't lost
    };

    try {
      const res = await createTaskComment(taskId, content);
      if (!res.ok) {
        // Real DB/RLS message, returned as data (see createTaskComment).
        console.error("[DiscussionThread] createTaskComment failed:", res.error);
        rollback();
        toast.error(res.error || "ส่งข้อความไม่สำเร็จ — ลองอีกครั้ง");
        return;
      }
      setComments((prev) => prev.map((c) => (c.id === tempId ? res.comment : c)));
    } catch (err) {
      console.error("[DiscussionThread] createTaskComment threw:", err);
      rollback();
      toast.error("ส่งข้อความไม่สำเร็จ — ลองอีกครั้ง");
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Enter sends; Shift+Enter inserts a newline.
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border bg-muted/20">
      <div className="shrink-0 border-b px-3 py-2 text-sm font-semibold">
        Discussion
      </div>

      <div
        ref={scrollRef}
        className="scrollbar-subtle min-h-0 flex-1 space-y-3 overflow-y-auto p-3"
      >
        {loading ? (
          <p className="py-6 text-center text-xs text-muted-foreground">
            กำลังโหลด…
          </p>
        ) : comments.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">
            ยังไม่มีข้อความ — เริ่มการสนทนาได้เลย
          </p>
        ) : (
          comments.map((c) => (
            <div
              key={c.id}
              className={cn("flex gap-2", c.pending && "opacity-60")}
            >
              <Avatar className="size-7 shrink-0">
                <AvatarFallback className="text-[10px]">
                  {initialsOf(c.authorName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="truncate text-xs font-semibold">
                    {c.authorName}
                  </span>
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    {formatDateTime(new Date(c.createdAt))}
                  </span>
                </div>
                <div className="mt-0.5 rounded-lg rounded-tl-none bg-background px-2.5 py-1.5 text-sm break-words whitespace-pre-wrap">
                  {c.content}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="shrink-0 border-t p-2">
        <div className="flex items-end gap-2">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="พิมพ์ข้อความ… (Enter ส่ง · Shift+Enter ขึ้นบรรทัดใหม่)"
            rows={1}
            className="max-h-32 min-h-9 resize-none"
          />
          <Button
            type="button"
            size="icon"
            onClick={submit}
            disabled={!text.trim() || sending}
            aria-label="ส่งข้อความ"
          >
            <Send className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
