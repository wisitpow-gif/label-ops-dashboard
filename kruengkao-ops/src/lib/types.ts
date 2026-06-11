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
  /** Label / sub-label the release belongs to */
  label: string;
  /** ISO date string yyyy-mm-dd */
  releaseDate: string;
}
