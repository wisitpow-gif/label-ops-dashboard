import "server-only";

import { createClient } from "@/lib/supabase/server";
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

// Initial dashboard payload — projects + their workback tasks.
// tasks_with_schedule is the view that resolves deadline/start from release_date.
export async function getDashboardData(): Promise<{
  projects: Project[];
  tasks: Task[];
}> {
  const supabase = await createClient();

  const [projectsRes, tasksRes] = await Promise.all([
    supabase.from("projects").select(PROJECT_COLS).order("release_date"),
    supabase.from("tasks_with_schedule").select(TASK_COLS).order("sort_order"),
  ]);

  if (projectsRes.error) throw new Error(projectsRes.error.message);
  if (tasksRes.error) throw new Error(tasksRes.error.message);

  return {
    projects: (projectsRes.data as ProjectRow[]).map(mapProject),
    tasks: (tasksRes.data as TaskRow[]).map(mapTask),
  };
}
