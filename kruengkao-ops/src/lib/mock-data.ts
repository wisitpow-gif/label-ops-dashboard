import type {
  Project,
  ProjectFinance,
  Task,
  TaskGroup,
  TaskStatus,
  TeamMember,
} from "./types";
import { addDays, parseDate } from "./dates";

// ---------------------------------------------------------------------------
// Mock data for the Dual-View Dashboard (Blueprint Part 2.1).
// Task template + T-minus offsets follow Blueprint Part 3.2 exactly.
// ---------------------------------------------------------------------------

export const TEAM: TeamMember[] = [
  { id: "mind", name: "มายด์", role: "Promoter", initials: "MD" },
  { id: "benz", name: "เบนซ์", role: "Producer", initials: "BZ" },
  { id: "ploy", name: "พลอย", role: "Graphic Designer", initials: "PL" },
  { id: "toon", name: "ตูน", role: "Video Editor", initials: "TN" },
  { id: "golf", name: "กอล์ฟ", role: "MV Director", initials: "GF" },
];

export const PROJECTS: Project[] = [
  {
    id: "p1",
    songName: "ใจเย็นเย็น",
    artistName: "Only Monday",
    label: "MACHg",
    releaseDate: "2026-07-17",
  },
  {
    id: "p2",
    songName: "แสงสุดท้าย",
    artistName: "Tilly Birds",
    label: "BRIDGE Management",
    releaseDate: "2026-08-21",
  },
  {
    id: "p3",
    songName: "ก่อนฤดูฝน",
    artistName: "AYLA's",
    label: "On & On",
    releaseDate: "2026-06-12",
  },
  {
    id: "p4",
    songName: "ไม่เห็นจะต้องอายเลยถ้าอยากจะร้องไห้",
    artistName: "The Darkest Romance",
    label: "BRIDGE Management",
    releaseDate: "2026-09-18",
  },
];

interface TaskTemplate {
  key: string;
  group: TaskGroup;
  name: string;
  tMinusDays: number;
  durationDays: number;
  picId: string;
  blockedByKey?: string;
}

// Blueprint Part 3.2 — Task Groups & Templates
const TASK_TEMPLATE: TaskTemplate[] = [
  // Group 1: Digital Distribution Pack
  { key: "typo", group: "Digital Dist. Pack", name: "Song Typo", tMinusDays: 84, durationDays: 7, picId: "mind" },
  { key: "cover", group: "Digital Dist. Pack", name: "Single Cover & Graphics", tMinusDays: 42, durationDays: 21, picId: "ploy", blockedByKey: "typo" },
  { key: "master", group: "Digital Dist. Pack", name: "Master Audio", tMinusDays: 42, durationDays: 28, picId: "benz" },
  { key: "audiopack", group: "Digital Dist. Pack", name: "Audio Pack Submission & Metadata", tMinusDays: 28, durationDays: 7, picId: "mind", blockedByKey: "master" },
  // Group 2: Teaser MV
  { key: "shoot", group: "Teaser MV", name: "MV Shooting", tMinusDays: 60, durationDays: 10, picId: "golf" },
  { key: "teaser", group: "Teaser MV", name: "Teaser Edit", tMinusDays: 28, durationDays: 18, picId: "toon", blockedByKey: "shoot" },
  { key: "tiktok", group: "Teaser MV", name: "Tiktok Cut", tMinusDays: 28, durationDays: 14, picId: "toon", blockedByKey: "shoot" },
  // Group 3: Full MV
  { key: "postprod", group: "Full MV", name: "Post-Production", tMinusDays: 50, durationDays: 25, picId: "toon", blockedByKey: "shoot" },
  { key: "finalcheck", group: "Full MV", name: "MV Final Check", tMinusDays: 30, durationDays: 7, picId: "mind", blockedByKey: "postprod" },
  { key: "mvpack", group: "Full MV", name: "MV Pack Submission", tMinusDays: 28, durationDays: 3, picId: "mind", blockedByKey: "finalcheck" },
];

function makeTasks(projectId: string, statuses: Record<string, TaskStatus>): Task[] {
  return TASK_TEMPLATE.map((t) => ({
    id: `${projectId}-${t.key}`,
    projectId,
    group: t.group,
    name: t.name,
    tMinusDays: t.tMinusDays,
    durationDays: t.durationDays,
    status: statuses[t.key] ?? "Not Start",
    picId: t.picId,
    blockedBy: t.blockedByKey ? `${projectId}-${t.blockedByKey}` : undefined,
  }));
}

export const TASKS: Task[] = [
  // p1 — mid-production: Master Audio overdue (WIP past deadline)
  // → downstream Audio Pack shows as Blocked (bottleneck demo)
  ...makeTasks("p1", {
    typo: "Done",
    cover: "Done",
    master: "WIP",
    audiopack: "Blocked",
    shoot: "Done",
    teaser: "WIP",
    tiktok: "Not Start",
    postprod: "Done",
    finalcheck: "WIP",
    mvpack: "Not Start",
  }),
  // p2 — early phase: most tasks not started yet
  ...makeTasks("p2", {
    typo: "Done",
    cover: "WIP",
    master: "WIP",
  }),
  // p3 — releasing this week: everything wrapped
  ...makeTasks("p3", {
    typo: "Done",
    cover: "Done",
    master: "Done",
    audiopack: "Done",
    shoot: "Done",
    teaser: "Done",
    tiktok: "Done",
    postprod: "Done",
    finalcheck: "Done",
    mvpack: "Done",
  }),
  // p4 — kickoff phase: recording wrapped, financial setup in progress
  ...makeTasks("p4", {
    typo: "Done",
    master: "WIP",
  }),
];

// ---------------------------------------------------------------------------
// Derived helpers used by both views
// ---------------------------------------------------------------------------

export function memberById(id: string): TeamMember | undefined {
  return TEAM.find((m) => m.id === id);
}

export function tasksOfProject(projectId: string): Task[] {
  return TASKS.filter((t) => t.projectId === projectId);
}

export function taskById(id: string): Task | undefined {
  return TASKS.find((t) => t.id === id);
}

/** Deadline = release date minus T-minus offset (calendar days for now) */
export function taskDeadline(task: Task, project: Project): Date {
  return addDays(parseDate(project.releaseDate), -task.tMinusDays);
}

/** Gantt bar start = deadline minus working window */
export function taskStart(task: Task, project: Project): Date {
  return addDays(taskDeadline(task, project), -task.durationDays);
}

/** Roll task statuses up to a pack-level status for the Project View columns */
export function packStatus(tasks: Task[]): TaskStatus {
  if (tasks.some((t) => t.status === "Blocked")) return "Blocked";
  if (tasks.length > 0 && tasks.every((t) => t.status === "Done")) return "Done";
  if (tasks.some((t) => t.status === "WIP" || t.status === "Done")) return "WIP";
  return "Not Start";
}

export const TASK_GROUPS: TaskGroup[] = [
  "Digital Dist. Pack",
  "Teaser MV",
  "Full MV",
];

// Artist roster — the Foolproof form only allows picking from this list
// (Blueprint Part 2.2: ห้ามพิมพ์ชื่อศิลปินเอง)
export const ARTISTS = [
  "AYLA's",
  "Only Monday",
  "Tilly Birds",
  "ASIA7",
  "Three Man Down",
  "The Darkest Romance",
] as const;

// Labels under บริษัท ครึ่งเก้า
export const LABELS = ["MACHg", "BRIDGE Management", "On & On"] as const;

// Contributor roles from the SONG_SPLITS schema (Blueprint Part 5)
// — used again in Phase 2 (Royalty Splits entry)
export const SPLIT_ROLES = ["Producer", "Lyric", "Melody", "Arrange"] as const;

/**
 * Generate the full workback task set for a newly initiated project
 * (Blueprint Part 3.2 template, all tasks starting at "Not Start").
 */
export function generateTasks(projectId: string): Task[] {
  return makeTasks(projectId, {});
}

// ---------------------------------------------------------------------------
// Phase 2: Financial & Contract Setup (Recoupable Ledger + Royalty Splits)
// ---------------------------------------------------------------------------

// Realistic scenario based on a real label spreadsheet:
// "ไม่เห็นจะต้องอายเลยถ้าอยากจะร้องไห้" — The Darkest Romance (p4)
const FINANCE: Record<string, ProjectFinance> = {
  p4: {
    expenses: [
      { id: "p4-e1", description: "Studio Tracking", payeeName: "Axis Studio", payeeType: "Company", amount: "12600", isRecoupable: true },
      { id: "p4-e2", description: "Mix, Edit, Master", payeeName: "กร มหาดำรงค์กุล", payeeType: "Individual", amount: "18000", isRecoupable: true },
      { id: "p4-e3", description: "Production Fee (Lyric, Melody, Arrange)", payeeName: "ธิติวัฒน์ รองทอง", payeeType: "Individual", amount: "16600", isRecoupable: true },
      { id: "p4-e4", description: "Drum Tech", payeeName: "ธณัตชัย เหลือรักษ์", payeeType: "Individual", amount: "3500", isRecoupable: false },
    ],
    splits: [
      { id: "p4-s1", role: "Lyric", payeeType: "Individual", name: "ธิติวัฒน์ รองทอง", percentage: "20.00", note: "Royalty จ่ายตามคนทำงาน" },
      { id: "p4-s2", role: "Melody", payeeType: "Individual", name: "ธิติวัฒน์ รองทอง", percentage: "20.00", note: "Royalty จ่ายตามคนทำงาน" },
      { id: "p4-s3", role: "Arrange", payeeType: "Band", name: "The Darkest Romance", percentage: "30.00", note: "Royalty สมาชิก 4 คนแบ่งเท่าๆกัน" },
      { id: "p4-s4", role: "Producer", payeeType: "Band", name: "The Darkest Romance", percentage: "30.00", note: "Royalty สมาชิก 4 คนแบ่งเท่าๆกัน" },
    ],
  },
};

/** Finance data for a project — projects without any yet get one blank row each */
export function financeOf(projectId: string): ProjectFinance {
  const found = FINANCE[projectId];
  if (found) {
    // copy so component state edits never mutate the mock source
    return {
      expenses: found.expenses.map((e) => ({ ...e })),
      splits: found.splits.map((s) => ({ ...s })),
    };
  }
  return {
    expenses: [
      { id: `${projectId}-e1`, description: "", payeeName: "", payeeType: "Individual", amount: "", isRecoupable: true },
    ],
    splits: [
      { id: `${projectId}-s1`, role: "", payeeType: "Individual", name: "", percentage: "", note: "" },
    ],
  };
}
