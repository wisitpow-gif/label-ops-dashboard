import type {
  AssetStatus,
  Project,
  ProjectAsset,
  ProjectType,
  Task,
  TaskDependency,
  TaskGroup,
  TaskStatus,
  TaskTemplate,
  WorkType,
} from "./types";

// Shapes of the rows returned by Supabase (snake_case columns).
export interface ProjectRow {
  id: string;
  song_title: string;
  artist: string | null;
  label: string | null;
  project_type: string;
  work_type: string;
  release_date: string | null; // yyyy-mm-dd
  target_date: string | null;
}

export interface TaskRow {
  id: string;
  project_id: string;
  category: string;
  task_name: string;
  role: string;
  assigned_to: string | null;
  status: string;
  t_minus_days: number;
  duration_days: number;
  due_date: string | null;
  blocked_by: string | null;
}

export function mapProject(row: ProjectRow): Project {
  return {
    id: row.id,
    songName: row.song_title,
    artistName: row.artist ?? "",
    label: row.label ?? "",
    projectType: (row.project_type as ProjectType) ?? "Single",
    workType: (row.work_type as WorkType) ?? "Release",
    releaseDate: row.release_date ?? "",
    targetDate: row.target_date ?? undefined,
  };
}

export interface TaskTemplateRow {
  id: string;
  project_type: string;
  task_key: string;
  category: string;
  task_name: string;
  role: string;
  t_minus_days: number;
  duration_days: number;
  sort_order: number;
}

export interface ProjectAssetRow {
  id: string;
  project_id: string;
  provider_role: string;
  asset_name: string;
  status: string;
  submitted_link: string | null;
  vault_link: string | null;
  submitter_note: string | null;
  reviewer_note: string | null;
  version: number;
  created_at: string;
  updated_at: string;
}

export function mapProjectAsset(row: ProjectAssetRow): ProjectAsset {
  return {
    id: row.id,
    projectId: row.project_id,
    providerRole: row.provider_role,
    assetName: row.asset_name,
    status: row.status as AssetStatus,
    submittedLink: row.submitted_link ?? undefined,
    vaultLink: row.vault_link ?? undefined,
    submitterNote: row.submitter_note ?? undefined,
    reviewerNote: row.reviewer_note ?? undefined,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapTaskTemplate(row: TaskTemplateRow): TaskTemplate {
  return {
    id: row.id,
    projectType: row.project_type as ProjectType,
    taskKey: row.task_key,
    category: row.category,
    taskName: row.task_name,
    role: row.role,
    tMinusDays: row.t_minus_days,
    durationDays: row.duration_days,
    sortOrder: row.sort_order,
  };
}

export function mapTask(row: TaskRow): Task {
  return {
    id: row.id,
    projectId: row.project_id,
    group: row.category as TaskGroup,
    name: row.task_name,
    tMinusDays: row.t_minus_days,
    durationDays: row.duration_days,
    status: row.status as TaskStatus,
    role: row.role,
    person: row.assigned_to ?? "",
    dueDate: row.due_date ?? undefined,
    blockedBy: row.blocked_by ?? undefined,
  };
}

export interface TaskDependencyRow {
  id: string;
  task_id: string;
  depends_on_task_id: string;
}

export function mapTaskDependency(row: TaskDependencyRow): TaskDependency {
  return {
    id: row.id,
    taskId: row.task_id,
    dependsOnTaskId: row.depends_on_task_id,
  };
}
