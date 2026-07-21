import type {
  Project,
  ProjectType,
  Task,
  TaskGroup,
  TaskStatus,
  TaskTemplate,
} from "./types";

// Shapes of the rows returned by Supabase (snake_case columns).
export interface ProjectRow {
  id: string;
  song_title: string;
  artist: string;
  label: string;
  project_type: string;
  release_date: string; // yyyy-mm-dd
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
  blocked_by: string | null;
}

export function mapProject(row: ProjectRow): Project {
  return {
    id: row.id,
    songName: row.song_title,
    artistName: row.artist,
    label: row.label,
    projectType: (row.project_type as ProjectType) ?? "Single",
    releaseDate: row.release_date,
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
    blockedBy: row.blocked_by ?? undefined,
  };
}
