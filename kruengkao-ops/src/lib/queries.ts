import "server-only";

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

/** Email of the currently authenticated user (null if somehow unauthenticated). */
export async function getCurrentUserEmail(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.email ?? null;
}

const PROJECT_COLS =
  "id, song_title, artist, label, project_type, work_type, release_date, target_date";
const TASK_COLS =
  "id, project_id, category, task_name, role, assigned_to, status, t_minus_days, duration_days, due_date, blocked_by";
const TEMPLATE_COLS =
  "id, project_type, task_key, category, task_name, role, t_minus_days, duration_days, sort_order";
const ASSET_COLS =
  "id, project_id, provider_role, asset_name, status, submitted_link, vault_link, submitter_note, reviewer_note, version, created_at, updated_at";

// Initial dashboard payload — projects + their workback tasks.
// tasks_with_schedule is the view that resolves deadline/start from release_date.
export async function getDashboardData(): Promise<{
  projects: Project[];
  tasks: Task[];
}> {
  const supabase = await createClient();

  const [projectsRes, tasksRes] = await Promise.all([
    // Release dashboard shows only Release projects; Internal work lives in /internal.
    supabase
      .from("projects")
      .select(PROJECT_COLS)
      .eq("work_type", "Release")
      .order("release_date"),
    // Base table (not tasks_with_schedule) — the app derives deadlines itself,
    // and the view's `select t.*` won't include newly added columns.
    supabase.from("tasks").select(TASK_COLS).order("sort_order"),
  ]);

  if (projectsRes.error) throw new Error(projectsRes.error.message);
  if (tasksRes.error) throw new Error(tasksRes.error.message);

  return {
    projects: (projectsRes.data as ProjectRow[]).map(mapProject),
    tasks: (tasksRes.data as TaskRow[]).map(mapTask),
  };
}

/** Internal/Ad-Hoc workspace: internal projects + their tasks + dependencies. */
export async function getInternalWorkspace(): Promise<{
  projects: Project[];
  tasks: Task[];
  dependencies: TaskDependency[];
}> {
  const supabase = await createClient();

  const { data: projData, error: projErr } = await supabase
    .from("projects")
    .select(PROJECT_COLS)
    .eq("work_type", "Internal")
    .order("created_at", { ascending: false });
  if (projErr) throw new Error(projErr.message);
  const projects = (projData as ProjectRow[]).map(mapProject);

  if (projects.length === 0) {
    return { projects: [], tasks: [], dependencies: [] };
  }

  const projectIds = projects.map((p) => p.id);
  const { data: taskData, error: taskErr } = await supabase
    .from("tasks")
    .select(TASK_COLS)
    .in("project_id", projectIds)
    .order("created_at", { ascending: true });
  if (taskErr) throw new Error(taskErr.message);
  const tasks = (taskData as TaskRow[]).map(mapTask);

  const taskIds = tasks.map((t) => t.id);
  let dependencies: TaskDependency[] = [];
  if (taskIds.length > 0) {
    const { data: depData, error: depErr } = await supabase
      .from("task_dependencies")
      .select("id, task_id, depends_on_task_id")
      .in("task_id", taskIds);
    if (depErr) throw new Error(depErr.message);
    dependencies = (depData as TaskDependencyRow[]).map(mapTaskDependency);
  }

  return { projects, tasks, dependencies };
}

/**
 * Team Workload payload — EVERY task across ALL work types (Release + Internal)
 * with their projects and dependency edges. Powers the per-assignee board.
 */
export async function getWorkloadData(): Promise<{
  projects: Project[];
  tasks: Task[];
  dependencies: TaskDependency[];
}> {
  const supabase = await createClient();

  const [projectsRes, tasksRes, depsRes] = await Promise.all([
    supabase.from("projects").select(PROJECT_COLS),
    supabase.from("tasks").select(TASK_COLS).order("created_at", { ascending: true }),
    supabase
      .from("task_dependencies")
      .select("id, task_id, depends_on_task_id"),
  ]);

  if (projectsRes.error) throw new Error(projectsRes.error.message);
  if (tasksRes.error) throw new Error(tasksRes.error.message);
  if (depsRes.error) throw new Error(depsRes.error.message);

  return {
    projects: (projectsRes.data as ProjectRow[]).map(mapProject),
    tasks: (tasksRes.data as TaskRow[]).map(mapTask),
    dependencies: (depsRes.data as TaskDependencyRow[]).map(mapTaskDependency),
  };
}

/** All projects (lightweight), sorted by release date. */
export async function getProjects(): Promise<Project[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_COLS)
    .order("release_date");
  if (error) throw new Error(error.message);
  return (data as ProjectRow[]).map(mapProject);
}

/** Every Vaulted asset across all projects (Library Map), newest first. */
export async function getVaultedAssets(): Promise<ProjectAsset[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_assets")
    .select(ASSET_COLS)
    .eq("status", "Vaulted")
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as ProjectAssetRow[]).map(mapProjectAsset);
}

/** A single project by id (null if not found). */
export async function getProjectById(id: string): Promise<Project | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_COLS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapProject(data as ProjectRow) : null;
}

/** DAM assets for a project, newest first. */
export async function getProjectAssets(
  projectId: string
): Promise<ProjectAsset[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_assets")
    .select(ASSET_COLS)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as ProjectAssetRow[]).map(mapProjectAsset);
}

/** All configurable task templates, ordered by type then sort order. */
export async function getTaskTemplates(): Promise<TaskTemplate[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("task_templates")
    .select(TEMPLATE_COLS)
    .order("project_type")
    .order("sort_order");

  if (error) throw new Error(error.message);
  return (data as TaskTemplateRow[]).map(mapTaskTemplate);
}
