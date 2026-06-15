import type {
  Project,
  ProjectFinance,
  Task,
  TaskGroup,
  TaskStatus,
} from "./types";
import { addDays, parseDate } from "./dates";

// ---------------------------------------------------------------------------
// Mock data for the Dual-View Dashboard (Blueprint Part 2.1).
// Task template + T-minus offsets follow Blueprint Part 3.2 exactly.
// ---------------------------------------------------------------------------

// 2-tier team structure: Role (department) → staff members.
// Tasks are assigned a role first, then a specific person within it.
export const UNASSIGNED = "Unassigned";

export interface RoleGroup {
  role: string;
  members: string[];
}

export const TEAM_STRUCTURE: RoleGroup[] = [
  { role: "Promoter", members: ["Eak", "Jah", "Ken", "Lookmou"] },
  { role: "Creative/MarCom", members: ["Pim", "Aft", "Nutt", "Mook"] },
  { role: "Graphics", members: ["Ken", "Hem", "Nan", "Korn", "Kai", "Mill"] },
  { role: "Producer", members: ["Pakbung", "Spy", "Lookkaew", "Ayu"] },
  { role: "Digital", members: ["Bomb"] },
  { role: "Distributor", members: ["External"] },
];

/** Roles in display order (excludes the Unassigned bucket) */
export const ROLES = TEAM_STRUCTURE.map((g) => g.role);

export function membersOfRole(role: string): string[] {
  return TEAM_STRUCTURE.find((g) => g.role === role)?.members ?? [];
}

/** Avatar initials from a person/role name */
export function initialsOf(name: string): string {
  return name ? name.slice(0, 2).toUpperCase() : "";
}

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
  role: string;
  person: string;
  blockedByKey?: string;
}

// Production task template — exact task names, groups and default roles.
// T-minus offsets / durations are sensible workback estimates (the engine is
// not yet holiday-aware, per Blueprint Part 3.1).
const TASK_TEMPLATE: TaskTemplate[] = [
  // Group 1: Digital Distribution Pack
  { key: "fullmix", group: "Digital Distribution Pack", name: "Full Mix Audio", tMinusDays: 45, durationDays: 14, role: "Promoter", person: "Eak" },
  { key: "minusone", group: "Digital Distribution Pack", name: "Minus One", tMinusDays: 40, durationDays: 7, role: "Promoter", person: "Jah", blockedByKey: "fullmix" },
  { key: "backing", group: "Digital Distribution Pack", name: "Backing Track", tMinusDays: 40, durationDays: 7, role: "Promoter", person: "Jah", blockedByKey: "fullmix" },
  { key: "metadata", group: "Digital Distribution Pack", name: "Metadata", tMinusDays: 28, durationDays: 5, role: "Promoter", person: "Ken" },
  { key: "cover", group: "Digital Distribution Pack", name: "Single Cover", tMinusDays: 42, durationDays: 21, role: "Graphics", person: "Hem" },
  { key: "artistprofile", group: "Digital Distribution Pack", name: "Artist Profile", tMinusDays: 35, durationDays: 7, role: "Promoter", person: "Lookmou" },
  { key: "songprofile", group: "Digital Distribution Pack", name: "Song Profile", tMinusDays: 35, durationDays: 7, role: "Promoter", person: "Lookmou" },
  { key: "tiktok", group: "Digital Distribution Pack", name: "Tiktok", tMinusDays: 21, durationDays: 10, role: "Creative/MarCom", person: "Nutt" },
  { key: "prphoto", group: "Digital Distribution Pack", name: "PR Photo", tMinusDays: 50, durationDays: 10, role: "Graphics", person: "Nan" },
  // Group 2: TEASER & MV
  { key: "shoot", group: "TEASER & MV", name: "ออกกอง", tMinusDays: 60, durationDays: 2, role: "Producer", person: "Pakbung" },
  { key: "shootphoto", group: "TEASER & MV", name: "ภาพออกกอง", tMinusDays: 58, durationDays: 5, role: "Producer", person: "Spy", blockedByKey: "shoot" },
  { key: "teasercut", group: "TEASER & MV", name: "TEASER Cutting Check", tMinusDays: 45, durationDays: 7, role: "Producer", person: "Pakbung", blockedByKey: "shoot" },
  { key: "teasercolor", group: "TEASER & MV", name: "TEASER Color Check", tMinusDays: 40, durationDays: 5, role: "Producer", person: "Lookkaew", blockedByKey: "teasercut" },
  { key: "teaserprint", group: "TEASER & MV", name: "TEASER Check print", tMinusDays: 35, durationDays: 3, role: "Producer", person: "Lookkaew", blockedByKey: "teasercolor" },
  { key: "mvcut", group: "TEASER & MV", name: "MV Cutting Check", tMinusDays: 30, durationDays: 10, role: "Producer", person: "Pakbung", blockedByKey: "shoot" },
  { key: "mvcolor", group: "TEASER & MV", name: "MV Color Check", tMinusDays: 20, durationDays: 7, role: "Producer", person: "Lookkaew", blockedByKey: "mvcut" },
  { key: "mvprint", group: "TEASER & MV", name: "MV Check print", tMinusDays: 14, durationDays: 3, role: "Producer", person: "Lookkaew", blockedByKey: "mvcolor" },
  { key: "subtitle", group: "TEASER & MV", name: "Subtitle", tMinusDays: 10, durationDays: 3, role: "Producer", person: "Ayu", blockedByKey: "mvprint" },
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
    role: t.role,
    person: t.person,
    blockedBy: t.blockedByKey ? `${projectId}-${t.blockedByKey}` : undefined,
  }));
}

export const TASKS: Task[] = [
  // 1 — Single Player (Jul 7): closest release, wrapping up
  ...makeTasks("1", {
    fullmix: "Done",
    minusone: "Done",
    backing: "Done",
    metadata: "Done",
    cover: "Done",
    artistprofile: "Done",
    songprofile: "Done",
    tiktok: "WIP",
    prphoto: "Done",
    shoot: "Done",
    shootphoto: "Done",
    teasercut: "Done",
    teasercolor: "Done",
    teaserprint: "Done",
    mvcut: "WIP",
  }),
  // 2 — จำเลย (Jul 14): advanced, with a bottleneck —
  // TEASER Cutting Check late → downstream Color Check shows Blocked
  ...makeTasks("2", {
    fullmix: "Done",
    minusone: "Done",
    backing: "WIP",
    cover: "Done",
    artistprofile: "WIP",
    songprofile: "WIP",
    prphoto: "Done",
    shoot: "Done",
    shootphoto: "Done",
    teasercut: "WIP",
    teasercolor: "Blocked",
    mvcut: "WIP",
  }),
  // 3 — OST (Jul 23): audio-led
  ...makeTasks("3", {
    fullmix: "Done",
    minusone: "Done",
    backing: "Done",
    metadata: "WIP",
    cover: "Done",
    artistprofile: "Done",
    songprofile: "WIP",
    prphoto: "WIP",
    shoot: "Done",
    shootphoto: "WIP",
  }),
  // 4 — ลืมลบเลือน (Aug 4): mid-production
  ...makeTasks("4", {
    fullmix: "Done",
    minusone: "WIP",
    backing: "WIP",
    cover: "WIP",
    prphoto: "Done",
    shoot: "Done",
    shootphoto: "WIP",
    mvcut: "WIP",
  }),
  // 5 — วัฏสงสาร (Aug 13): mid-early
  ...makeTasks("5", {
    fullmix: "Done",
    cover: "WIP",
    prphoto: "WIP",
    shoot: "Done",
    shootphoto: "WIP",
  }),
  // 6 — คะนึงนิตย์ (Aug 20): early phase
  ...makeTasks("6", {
    fullmix: "WIP",
    cover: "WIP",
  }),
  // 7 — เพลงกัลยา (Aug 25): early phase
  ...makeTasks("7", {
    fullmix: "WIP",
  }),
  // 8 — S.1 (Sep 3): kickoff
  ...makeTasks("8", {}),
];

// ---------------------------------------------------------------------------
// Derived helpers used by both views
// ---------------------------------------------------------------------------

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
  "Digital Distribution Pack",
  "TEASER & MV",
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
