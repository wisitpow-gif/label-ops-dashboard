// Domain types mirroring the Master Database Schema (Blueprint Part 5).
// UI-only for now — these will map to Supabase tables later.

export type TaskStatus = "Not Start" | "WIP" | "Done" | "Blocked";

export type TaskGroup = "Digital Distribution Pack" | "TEASER & MV";

export type ProjectType = "Single" | "Album" | "Live Session" | "Other";

export type WorkType = "Release" | "Internal";

/** A person on the team, assignable to tasks in their role (DB-backed roster). */
export interface TeamMember {
  id: string;
  name: string;
  role: string;
  /** Optional contact email (groundwork for auth-linked personal views). */
  email?: string;
}

/** A prerequisite edge: `taskId` is gated by `dependsOnTaskId` (hard gate). */
export interface TaskDependency {
  id: string;
  taskId: string;
  dependsOnTaskId: string;
}

// --- DAM: Digital Asset Management (Quick Drop → verify → official → backup) ---

/** One row of project_assets — a submitted file tracked across cloud + local. */
export interface ProjectAsset {
  id: string;
  projectId: string;
  category: string;
  /** Short note / file name. */
  note: string;
  /** Team member's temporary external link (Drive/Dropbox/…). */
  sourceLink: string;
  /** Admin's final Official Google Drive link (empty until processed). */
  officialDriveLink?: string;
  /** Backed up to physical local storage (HDD/SSD). */
  isBackedUpLocal: boolean;
  createdAt: string;
  updatedAt: string;
}

/** A configurable task-template row (maps to the task_templates table). */
export interface TaskTemplate {
  id: string;
  projectType: ProjectType;
  taskKey: string;
  category: string;
  taskName: string;
  role: string;
  tMinusDays: number;
  durationDays: number;
  sortOrder: number;
}

/** A task to insert verbatim when creating a project (wizard: customized timeline). */
export interface CustomTaskInput {
  taskName: string;
  role: string;
  person: string; // "" = unassigned
  category: string;
  tMinusDays: number;
  durationDays: number;
  taskKey?: string;
  sortOrder: number;
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
  /** Assigned role / department, e.g. "Producer" or "Unassigned" (tier 1) */
  role: string;
  /** Specific staff member within the role; "" = nobody chosen yet (tier 2) */
  person: string;
  /** Optional direct due date (used by Internal tasks; releases derive from T-minus) */
  dueDate?: string;
  /** Stored timeline range (yyyy-mm-dd). When set, these win over the workback. */
  startDate?: string;
  endDate?: string;
  /** Upstream dependency — when that task is late, this one shows as Blocked */
  blockedBy?: string;
}

// --- Phase 2: Financial & Contract Setup ---

/** PAYEES.payee_type — Individual / Company / Band (Blueprint Part 5) */
export type PayeeType = "Individual" | "Company" | "Band";

/** One row of the Recoupable Ledger (maps to PROJECT_EXPENSES) */
export interface ExpenseEntry {
  id: string;
  description: string;
  payeeName: string;
  payeeType: PayeeType;
  /** Kept as string for free typing; parsed for totals */
  amount: string;
  isRecoupable: boolean;
}

/** One royalty split row (maps to SONG_SPLITS) */
export interface SplitEntry {
  id: string;
  role: string;
  payeeType: PayeeType;
  name: string;
  /** Kept as string for free typing; parsed for totals */
  percentage: string;
  /** Payment condition, e.g. "สมาชิก 4 คนแบ่งเท่าๆกัน" */
  note: string;
}

export interface ProjectFinance {
  expenses: ExpenseEntry[];
  splits: SplitEntry[];
}

export interface Project {
  id: string;
  songName: string;
  artistName: string;
  /** Label / sub-label the release belongs to ("" for Internal work) */
  label: string;
  /** Workflow type — drives which task template generates its tasks */
  projectType: ProjectType;
  /** Release vs Internal/Ad-Hoc work */
  workType: WorkType;
  /** ISO date string yyyy-mm-dd ("" for Internal work) */
  releaseDate: string;
  /** Optional overall deadline for Internal work */
  targetDate?: string;
}
