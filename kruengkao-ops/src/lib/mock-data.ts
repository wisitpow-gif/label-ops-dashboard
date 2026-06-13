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

// Exact release schedule extracted from the label's spreadsheet.
export const PROJECTS: Project[] = [
  {
    id: "1",
    songName: "Single Player",
    artistName: "NINEOKMAI",
    label: "BRIDGE",
    releaseDate: "2026-07-07",
  },
  {
    id: "2",
    songName: "จำเลย",
    artistName: "Tilly Birds",
    label: "BRIDGE",
    releaseDate: "2026-07-14",
  },
  {
    id: "3",
    songName: "OST. คำสารภาพของหมอผี",
    artistName: "ปราง ปรางทิพย์",
    label: "MACHg",
    releaseDate: "2026-07-23",
  },
  {
    id: "4",
    songName: "ลืมลบเลือน",
    artistName: "Hard Boy",
    label: "BRIDGE",
    releaseDate: "2026-08-04",
  },
  {
    id: "5",
    songName: "วัฏสงสาร",
    artistName: "TaitosmitH Feat. PINKIE",
    label: "9Arkkhan",
    releaseDate: "2026-08-13",
  },
  {
    id: "6",
    songName: "คะนึงนิตย์",
    artistName: "ปราง ปรางทิพย์",
    label: "MACHg",
    releaseDate: "2026-08-20",
  },
  {
    id: "7",
    songName: "เพลงกัลยา",
    artistName: "ASIA7",
    label: "BRIDGE",
    releaseDate: "2026-08-25",
  },
  {
    id: "8",
    songName: "หนุ่ม ปริญวัฒน์ S.1",
    artistName: "หนุ่ม ปริญวัฒน์",
    label: "MACHg",
    releaseDate: "2026-09-03",
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
  // 1 — Single Player (Jul 7): closest release, wrapping up
  ...makeTasks("1", {
    typo: "Done",
    cover: "Done",
    master: "Done",
    audiopack: "Done",
    shoot: "Done",
    teaser: "Done",
    tiktok: "WIP",
    postprod: "Done",
    finalcheck: "Done",
    mvpack: "WIP",
  }),
  // 2 — จำเลย (Jul 14): advanced, with a bottleneck —
  // Master Audio late → downstream Audio Pack shows Blocked
  ...makeTasks("2", {
    typo: "Done",
    cover: "Done",
    master: "WIP",
    audiopack: "Blocked",
    shoot: "Done",
    teaser: "WIP",
    tiktok: "WIP",
    postprod: "Done",
    finalcheck: "WIP",
    mvpack: "Not Start",
  }),
  // 3 — OST (Jul 23): audio-led, MV minimal
  ...makeTasks("3", {
    typo: "Done",
    cover: "Done",
    master: "Done",
    audiopack: "WIP",
  }),
  // 4 — ลืมลบเลือน (Aug 4): mid-production
  ...makeTasks("4", {
    typo: "Done",
    cover: "WIP",
    master: "WIP",
    shoot: "Done",
    postprod: "WIP",
  }),
  // 5 — วัฏสงสาร (Aug 13): mid-early
  ...makeTasks("5", {
    typo: "Done",
    cover: "WIP",
    master: "WIP",
    shoot: "Done",
  }),
  // 6 — คะนึงนิตย์ (Aug 20): early phase
  ...makeTasks("6", {
    typo: "Done",
    master: "WIP",
  }),
  // 7 — เพลงกัลยา (Aug 25): early phase
  ...makeTasks("7", {
    typo: "Done",
    cover: "WIP",
  }),
  // 8 — S.1 (Sep 3): kickoff
  ...makeTasks("8", {
    typo: "WIP",
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
export const LABELS = ["BRIDGE", "MACHg", "9Arkkhan"] as const;

// Sentinel for the global header filter ("show every label")
export const LABEL_FILTER_ALL = "Select All";

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

// No per-project finance samples yet — each project opens the Finance & Splits
// tab with one blank starter row. Populate a key here (by project id) once real
// expense/split figures are available for a song.
const FINANCE: Record<string, ProjectFinance> = {};

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
