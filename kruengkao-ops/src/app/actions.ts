"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  mapProject,
  mapProjectAsset,
  mapTask,
  mapTaskDependency,
  mapTaskTemplate,
  type ProjectAssetRow,
  type ProjectRow,
  type TaskDependencyRow,
  type TaskRow,
  type TaskTemplateRow,
} from "@/lib/mappers";
import type {
  Project,
  ProjectAsset,
  Task,
  TaskDependency,
  TaskTemplate,
} from "@/lib/types";

const ASSET_COLS =
  "id, project_id, provider_role, asset_name, status, submitted_link, vault_link, submitter_note, reviewer_note, version, created_at, updated_at";

const PROJECT_COLS = "id, song_title, artist, label, project_type, release_date";
const TASK_COLS =
  "id, project_id, category, task_name, role, assigned_to, status, t_minus_days, duration_days, due_date, blocked_by";
const TEMPLATE_COLS =
  "id, project_type, task_key, category, task_name, role, t_minus_days, duration_days, sort_order";

export interface CreateProjectInput {
  songTitle: string;
  artist: string;
  label: string;
  projectType: string;
  releaseDate: string; // yyyy-mm-dd
}

/**
 * Insert a project, then generate its tasks from the task_templates rows for
 * the chosen project_type. Returns both mapped to the app's domain types.
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
      project_type: input.projectType,
      release_date: input.releaseDate,
    })
    .select(PROJECT_COLS)
    .single();

  if (projectErr || !projectRow) {
    throw new Error(projectErr?.message ?? "Failed to create project");
  }

  // Pull the configured template for this project type (Settings → Templates).
  const { data: templates, error: tmplErr } = await supabase
    .from("task_templates")
    .select(TEMPLATE_COLS)
    .eq("project_type", input.projectType)
    .order("sort_order");

  if (tmplErr) {
    await supabase.from("projects").delete().eq("id", projectRow.id);
    throw new Error(tmplErr.message);
  }

  const taskRows = (templates ?? []).map((t, i) => ({
    id: crypto.randomUUID(),
    project_id: projectRow.id,
    task_key: t.task_key,
    category: t.category,
    task_name: t.task_name,
    role: t.role,
    assigned_to: null,
    status: "Not Start",
    t_minus_days: t.t_minus_days,
    duration_days: t.duration_days,
    blocked_by: null,
    sort_order: t.sort_order ?? i,
  }));

  let insertedTasks: TaskRow[] = [];
  if (taskRows.length > 0) {
    const { data, error: tasksErr } = await supabase
      .from("tasks")
      .insert(taskRows)
      .select(TASK_COLS);

    if (tasksErr) {
      // Roll back the orphaned project so we never persist a half-created one.
      await supabase.from("projects").delete().eq("id", projectRow.id);
      throw new Error(tasksErr.message);
    }
    insertedTasks = data as TaskRow[];
  }

  revalidatePath("/");

  return {
    project: mapProject(projectRow as ProjectRow),
    tasks: insertedTasks.map(mapTask),
  };
}

// project_type is fixed after creation (tasks are already generated), so the
// edit flow can't change it.
export interface UpdateProjectInput
  extends Omit<CreateProjectInput, "projectType"> {
  id: string;
}

/** Update a project's Phase 1 fields, returning the updated row. */
export async function updateProject(
  input: UpdateProjectInput
): Promise<Project> {
  const supabase = await createClient();

  const { data: projectRow, error } = await supabase
    .from("projects")
    .update({
      song_title: input.songTitle,
      artist: input.artist,
      label: input.label,
      release_date: input.releaseDate,
    })
    .eq("id", input.id)
    .select(PROJECT_COLS)
    .single();

  if (error || !projectRow) {
    throw new Error(error?.message ?? "Failed to update project");
  }

  revalidatePath("/");
  return mapProject(projectRow as ProjectRow);
}

export interface UpdateTaskInput {
  status?: string;
  role?: string;
  person?: string; // maps to assigned_to ("" => null/unassigned)
  taskName?: string;
  dueDate?: string | null; // "" / null => clear
}

/** Persist a single task's status / assignment / detail changes.
 *  Hard gate: refuses to set status = "Done" until every prerequisite in
 *  task_dependencies is itself Done. */
export async function updateTask(
  id: string,
  patch: UpdateTaskInput
): Promise<void> {
  const supabase = await createClient();

  if (patch.status === "Done") {
    const { data: deps, error: depErr } = await supabase
      .from("task_dependencies")
      .select("depends_on_task_id")
      .eq("task_id", id);
    if (depErr) throw new Error(depErr.message);

    const prereqIds = (deps ?? []).map(
      (d) => (d as { depends_on_task_id: string }).depends_on_task_id
    );
    if (prereqIds.length > 0) {
      const { data: prereqs, error: pErr } = await supabase
        .from("tasks")
        .select("task_name, status")
        .in("id", prereqIds);
      if (pErr) throw new Error(pErr.message);
      const unmet = (prereqs ?? []).filter(
        (t) => (t as { status: string }).status !== "Done"
      );
      if (unmet.length > 0) {
        const names = unmet
          .map((t) => (t as { task_name: string }).task_name)
          .join(", ");
        throw new Error(`ต้องทำให้เสร็จก่อน: ${names}`);
      }
    }
  }

  const payload: Record<string, string | null> = {};
  if (patch.status !== undefined) payload.status = patch.status;
  if (patch.role !== undefined) payload.role = patch.role;
  if (patch.person !== undefined) payload.assigned_to = patch.person || null;
  if (patch.taskName !== undefined) payload.task_name = patch.taskName;
  if (patch.dueDate !== undefined) payload.due_date = patch.dueDate || null;

  if (Object.keys(payload).length === 0) return;

  const { error } = await supabase.from("tasks").update(payload).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/internal");
}

/** Delete a project; tasks/expenses/splits cascade via the FK constraints. */
export async function deleteProject(id: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from("projects").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
}

// ---------------------------------------------------------------------------
// Task-template CRUD (Settings → Templates)
// ---------------------------------------------------------------------------

export interface TaskTemplateInput {
  projectType: string;
  category: string;
  taskName: string;
  role: string;
  tMinusDays: number;
  durationDays: number;
}

function slugifyKey(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  // Append a short random suffix so (project_type, task_key) stays unique
  // even for non-latin names (base may be empty for Thai-only titles).
  return `${base || "task"}-${crypto.randomUUID().slice(0, 6)}`;
}

/** Insert a template; sort_order is appended to the end of its type group. */
export async function createTaskTemplate(
  input: TaskTemplateInput
): Promise<TaskTemplate> {
  const supabase = await createClient();

  // Next sort_order within this project type
  const { data: last } = await supabase
    .from("task_templates")
    .select("sort_order")
    .eq("project_type", input.projectType)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextSort = (last?.sort_order ?? -1) + 1;

  const { data, error } = await supabase
    .from("task_templates")
    .insert({
      project_type: input.projectType,
      task_key: slugifyKey(input.taskName),
      category: input.category,
      task_name: input.taskName,
      role: input.role,
      t_minus_days: input.tMinusDays,
      duration_days: input.durationDays,
      sort_order: nextSort,
    })
    .select(TEMPLATE_COLS)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to add template");
  }

  revalidatePath("/settings/templates");
  return mapTaskTemplate(data as TaskTemplateRow);
}

/** Update a template's editable fields. */
export async function updateTaskTemplate(
  id: string,
  input: TaskTemplateInput
): Promise<TaskTemplate> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("task_templates")
    .update({
      category: input.category,
      task_name: input.taskName,
      role: input.role,
      t_minus_days: input.tMinusDays,
      duration_days: input.durationDays,
    })
    .eq("id", id)
    .select(TEMPLATE_COLS)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update template");
  }

  revalidatePath("/settings/templates");
  return mapTaskTemplate(data as TaskTemplateRow);
}

export async function deleteTaskTemplate(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("task_templates").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/settings/templates");
}

export interface SyncResult {
  projects: number; // projects that received at least one change
  inserted: number; // new tasks added
  updated: number; // existing tasks re-timed/re-roled
}

/**
 * Push the current template for `projectType` to every existing project of
 * that type. Non-destructive:
 *  - missing template tasks are INSERTED (status "Not Start", unassigned)
 *  - existing tasks (matched by task_key, then task_name) have only
 *    t_minus_days / duration_days / role updated — never status or assigned_to
 *  - extra ad-hoc tasks on a project are left untouched (never deleted)
 */
export async function syncTemplateToProjects(
  projectType: string
): Promise<SyncResult> {
  const supabase = await createClient();

  const { data: tmplData, error: tmplErr } = await supabase
    .from("task_templates")
    .select(TEMPLATE_COLS)
    .eq("project_type", projectType)
    .order("sort_order");
  if (tmplErr) throw new Error(tmplErr.message);
  const templates = (tmplData ?? []) as TaskTemplateRow[];

  const { data: projData, error: projErr } = await supabase
    .from("projects")
    .select("id")
    .eq("project_type", projectType);
  if (projErr) throw new Error(projErr.message);
  const projectIds = (projData ?? []).map((p) => (p as { id: string }).id);

  if (projectIds.length === 0 || templates.length === 0) {
    return { projects: 0, inserted: 0, updated: 0 };
  }

  type ExistingTask = {
    id: string;
    project_id: string;
    task_key: string | null;
    task_name: string;
    role: string;
    t_minus_days: number;
    duration_days: number;
  };

  const { data: taskData, error: taskErr } = await supabase
    .from("tasks")
    .select(
      "id, project_id, task_key, task_name, role, t_minus_days, duration_days"
    )
    .in("project_id", projectIds);
  if (taskErr) throw new Error(taskErr.message);
  const existing = (taskData ?? []) as ExistingTask[];

  // Index existing tasks by project + identity (task_key, falling back to name)
  const byKey = new Map<string, ExistingTask>();
  for (const t of existing) {
    if (t.task_key) byKey.set(`${t.project_id}::k::${t.task_key}`, t);
    byKey.set(`${t.project_id}::n::${t.task_name}`, t);
  }

  const inserts: Record<string, unknown>[] = [];
  const updates: {
    id: string;
    role: string;
    t_minus_days: number;
    duration_days: number;
  }[] = [];
  const affected = new Set<string>();

  for (const pid of projectIds) {
    for (const tm of templates) {
      const match =
        byKey.get(`${pid}::k::${tm.task_key}`) ??
        byKey.get(`${pid}::n::${tm.task_name}`);

      if (!match) {
        inserts.push({
          id: crypto.randomUUID(),
          project_id: pid,
          task_key: tm.task_key,
          category: tm.category,
          task_name: tm.task_name,
          role: tm.role,
          assigned_to: null,
          status: "Not Start",
          t_minus_days: tm.t_minus_days,
          duration_days: tm.duration_days,
          blocked_by: null,
          sort_order: tm.sort_order,
        });
        affected.add(pid);
      } else if (
        match.role !== tm.role ||
        match.t_minus_days !== tm.t_minus_days ||
        match.duration_days !== tm.duration_days
      ) {
        // Only re-time/re-role — status & assigned_to are preserved.
        updates.push({
          id: match.id,
          role: tm.role,
          t_minus_days: tm.t_minus_days,
          duration_days: tm.duration_days,
        });
        affected.add(pid);
      }
    }
  }

  if (inserts.length > 0) {
    const { error } = await supabase.from("tasks").insert(inserts);
    if (error) throw new Error(error.message);
  }

  for (const u of updates) {
    const { error } = await supabase
      .from("tasks")
      .update({
        role: u.role,
        t_minus_days: u.t_minus_days,
        duration_days: u.duration_days,
      })
      .eq("id", u.id);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/");
  return {
    projects: affected.size,
    inserted: inserts.length,
    updated: updates.length,
  };
}

// ---------------------------------------------------------------------------
// DAM — project_assets (Ingest Hub)
// ---------------------------------------------------------------------------

function revalidateIngest(projectId: string) {
  revalidatePath(`/projects/${projectId}/ingest`);
}

export interface CreateAssetInput {
  projectId: string;
  providerRole: string;
  assetName: string;
  submittedLink: string;
  submitterNote: string;
}

/** Creator submits a new asset — starts at "Pending Review", version 1. */
export async function createProjectAsset(
  input: CreateAssetInput
): Promise<ProjectAsset> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_assets")
    .insert({
      project_id: input.projectId,
      provider_role: input.providerRole,
      asset_name: input.assetName,
      submitted_link: input.submittedLink || null,
      submitter_note: input.submitterNote || null,
      status: "Pending Review",
      version: 1,
    })
    .select(ASSET_COLS)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to submit asset");
  }
  revalidateIngest(input.projectId);
  return mapProjectAsset(data as ProjectAssetRow);
}

export interface ReviewAssetInput {
  status: "Vaulted" | "Revision";
  vaultLink: string;
  reviewerNote: string;
}

/** Digital team reviews: approve (Vaulted + vault_link) or reject (Revision). */
export async function reviewProjectAsset(
  id: string,
  input: ReviewAssetInput
): Promise<ProjectAsset> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_assets")
    .update({
      status: input.status,
      vault_link: input.vaultLink || null,
      reviewer_note: input.reviewerNote || null,
    })
    .eq("id", id)
    .select(ASSET_COLS)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to review asset");
  }
  const asset = mapProjectAsset(data as ProjectAssetRow);
  revalidateIngest(asset.projectId);
  return asset;
}

export interface ResubmitAssetInput {
  submittedLink: string;
  submitterNote: string;
}

/** Creator resubmits a Revision item — back to Pending Review, version + 1. */
export async function resubmitProjectAsset(
  id: string,
  input: ResubmitAssetInput
): Promise<ProjectAsset> {
  const supabase = await createClient();

  const { data: current, error: readErr } = await supabase
    .from("project_assets")
    .select("version")
    .eq("id", id)
    .single();
  if (readErr || !current) {
    throw new Error(readErr?.message ?? "Asset not found");
  }

  const { data, error } = await supabase
    .from("project_assets")
    .update({
      submitted_link: input.submittedLink || null,
      submitter_note: input.submitterNote || null,
      status: "Pending Review",
      version: (current.version as number) + 1,
    })
    .eq("id", id)
    .select(ASSET_COLS)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to resubmit asset");
  }
  const asset = mapProjectAsset(data as ProjectAssetRow);
  revalidateIngest(asset.projectId);
  return asset;
}

export async function deleteProjectAsset(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("project_assets").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ---------------------------------------------------------------------------
// Internal / Ad-Hoc work (/internal)
// ---------------------------------------------------------------------------

export interface InternalProjectInput {
  name: string;
  targetDate?: string | null;
}

/** Create an Internal project (no artist/label/release — optional target). */
export async function createInternalProject(
  input: InternalProjectInput
): Promise<Project> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .insert({
      song_title: input.name,
      work_type: "Internal",
      target_date: input.targetDate || null,
    })
    .select(PROJECT_COLS)
    .single();
  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create internal project");
  }
  revalidatePath("/internal");
  return mapProject(data as ProjectRow);
}

export async function updateInternalProject(
  id: string,
  input: InternalProjectInput
): Promise<Project> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .update({ song_title: input.name, target_date: input.targetDate || null })
    .eq("id", id)
    .select(PROJECT_COLS)
    .single();
  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update internal project");
  }
  revalidatePath("/internal");
  return mapProject(data as ProjectRow);
}

/** Reuse the cascading project delete for internal projects too. */
export async function deleteInternalProject(id: string): Promise<void> {
  return deleteProject(id);
}

export interface CreateTaskInput {
  projectId: string;
  taskName: string;
  role: string;
  person: string;
  dueDate?: string | null;
}

/** Add a manual task to an Internal project (category "General"). */
export async function createTask(input: CreateTaskInput): Promise<Task> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      project_id: input.projectId,
      task_key: null,
      category: "General",
      task_name: input.taskName,
      role: input.role,
      assigned_to: input.person || null,
      status: "Not Start",
      t_minus_days: 0,
      duration_days: 0,
      due_date: input.dueDate || null,
    })
    .select(TASK_COLS)
    .single();
  if (error || !data) {
    throw new Error(error?.message ?? "Failed to add task");
  }
  revalidatePath("/internal");
  return mapTask(data as TaskRow);
}

export async function deleteTask(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/internal");
}

/**
 * Add a hard-gate dependency (taskId depends on dependsOnTaskId), rejecting
 * anything that would create a cycle. Returns the created edge.
 */
export async function addTaskDependency(
  taskId: string,
  dependsOnTaskId: string
): Promise<TaskDependency> {
  if (taskId === dependsOnTaskId) {
    throw new Error("งานไม่สามารถขึ้นกับตัวเองได้");
  }
  const supabase = await createClient();

  // Cycle check: would dependsOnTaskId (transitively) already depend on taskId?
  const { data: allDeps, error: depErr } = await supabase
    .from("task_dependencies")
    .select("task_id, depends_on_task_id");
  if (depErr) throw new Error(depErr.message);

  const prereqsOf = new Map<string, string[]>();
  for (const d of allDeps ?? []) {
    const row = d as { task_id: string; depends_on_task_id: string };
    if (!prereqsOf.has(row.task_id)) prereqsOf.set(row.task_id, []);
    prereqsOf.get(row.task_id)!.push(row.depends_on_task_id);
  }
  // Walk prerequisites starting from dependsOnTaskId; reaching taskId => cycle.
  const stack = [dependsOnTaskId];
  const seen = new Set<string>();
  while (stack.length) {
    const node = stack.pop()!;
    if (node === taskId) {
      throw new Error("สร้าง dependency นี้ไม่ได้ — จะเกิดวงจร (cycle)");
    }
    if (seen.has(node)) continue;
    seen.add(node);
    for (const p of prereqsOf.get(node) ?? []) stack.push(p);
  }

  const { data, error } = await supabase
    .from("task_dependencies")
    .upsert(
      { task_id: taskId, depends_on_task_id: dependsOnTaskId },
      { onConflict: "task_id,depends_on_task_id", ignoreDuplicates: false }
    )
    .select("id, task_id, depends_on_task_id")
    .single();
  if (error || !data) {
    throw new Error(error?.message ?? "Failed to add dependency");
  }
  revalidatePath("/internal");
  return mapTaskDependency(data as TaskDependencyRow);
}

export async function removeTaskDependency(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("task_dependencies")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/internal");
}
