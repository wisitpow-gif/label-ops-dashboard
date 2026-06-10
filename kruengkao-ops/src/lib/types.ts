// Domain types mirroring the Master Database Schema (Blueprint Part 5).
// UI-only for now — these will map to Supabase tables later.

export type TaskStatus = "Not Start" | "WIP" | "Done" | "Blocked";

export type TaskGroup = "Digital Dist. Pack" | "Teaser MV" | "Full MV";

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  initials: string;
}

export interface Task {
  id: string;
  projectId: string;
  group: TaskGroup;
  name: string;
  /** Deadline offset counted back from release date, e.g. 84 = T-84 (Blueprint Part 3.2) */
  tMinusDays: number;
  /** Working window length used to draw the Gantt bar */
  durationDays: number;
  status: TaskStatus;
  picId: string;
  /** Upstream dependency — when that task is late, this one shows as Blocked */
  blockedBy?: string;
}

export interface Project {
  id: string;
  songName: string;
  artistName: string;
  /** ISO date string yyyy-mm-dd */
  releaseDate: string;
}
