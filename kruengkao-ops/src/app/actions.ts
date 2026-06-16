"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { TASK_TEMPLATE } from "@/lib/mock-data";
import {
  mapProject,
  mapTask,
  type ProjectRow,
  type TaskRow,
} from "@/lib/mappers";
import type { Project, Task } from "@/lib/types";

const PROJECT_COLS = "id, song_title, artist, label, release_date";
const TASK_COLS =
  "id, project_id, category, task_name, role, assigned_to, status, t_minus_days, duration_days, blocked_by";

export interface CreateProjectInput {
  songTitle: string;
  artist: string;
  label: string;
  releaseDate: string; // yyyy-mm-dd
}

/**
 * Insert a project and its full default workback task set (Blueprint 3.2),
 * returning both mapped to the app's domain types.
 */
export async function createProject(
  input: CreateProjectInput
): Promise<{ project: Project; tasks: Task[] }> {
  const supabase = await createClient();

  const { data: projectRow, error: projectErr } = await supabase
    .from("projects")
    .insert({
      song_title: input.songTitle,
      artist: input.artist,
      label: input.label,
      release_date: input.releaseDate,
    })
    .select(PROJECT_COLS)
    .single();

  if (projectErr || !projectRow) {
    throw new Error(projectErr?.message ?? "Failed to create project");
  }

  // Pre-generate task ids so blocked_by can reference siblings in one insert.
  const idByKey = new Map<string, string>(
    TASK_TEMPLATE.map((t) => [t.key, crypto.randomUUID()])
  );
  const taskRows = TASK_TEMPLATE.map((t, i) => ({
    id: idByKey.get(t.key)!,
    project_id: projectRow.id,
    task_key: t.key,
    category: t.group,
    task_name: t.name,
    role: t.role,
    assigned_to: t.person || null,
    status: "Not Start",
    t_minus_days: t.tMinusDays,
    duration_days: t.durationDays,
    blocked_by: t.blockedByKey ? (idByKey.get(t.blockedByKey) ?? null) : null,
    sort_order: i,
  }));

  const { data: insertedTasks, error: tasksErr } = await supabase
    .from("tasks")
    .insert(taskRows)
    .select(TASK_COLS);

  if (tasksErr) {
    // Roll back the orphaned project so we never persist a project with no tasks.
    await supabase.from("projects").delete().eq("id", projectRow.id);
    throw new Error(tasksErr.message);
  }

  revalidatePath("/");

  return {
    project: mapProject(projectRow as ProjectRow),
    tasks: (insertedTasks as TaskRow[]).map(mapTask),
  };
}
