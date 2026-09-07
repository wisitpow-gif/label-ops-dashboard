// Label + Artist pick-lists now live in the DB (labels / artists tables,
// migration 0016) and are fetched via getLabelsWithArtists(). The Create/Edit
// project form receives them as a prop — no hardcoded roster here anymore.

// Project types (mirrors the projects.project_type CHECK / task_templates).
export const PROJECT_TYPES = [
  "Single",
  "Album",
  "Live Session",
  "Concert",
  "Other",
] as const;

// A small emoji per project type — a visual identifier shown wherever the
// type appears (project rows, type-group headers, filters, forms).
export const PROJECT_TYPE_EMOJI: Record<string, string> = {
  Single: "🎵",
  Album: "💿",
  "Live Session": "🎙️",
  Concert: "🎫",
  Other: "🎧",
};

export function projectTypeEmoji(type: string): string {
  return PROJECT_TYPE_EMOJI[type] ?? "🎧";
}

/** "🎵 Single" — emoji + type, for dropdowns and headers. */
export function projectTypeLabel(type: string): string {
  return `${projectTypeEmoji(type)} ${type}`;
}

// Task categories available in the template editor. "Demo" is the upstream
// A&R phase (selecting artist demos) and leads the pipeline.
export const TEMPLATE_CATEGORIES = [
  "Demo",
  "Digital Distribution Pack",
  "TEASER & MV",
  "Online Content",
] as const;

// Canonical CBS group order for the Finance → Production Expenses table.
// Groups present in the data but not listed here render last (alphabetical).
export const EXPENSE_GROUP_ORDER = [
  "AUDIO MASTER",
  "Music Video",
  "Key Visual",
  "Promo Materials",
  "Other",
] as const;

export const UNGROUPED_EXPENSE = "Ungrouped";

// Asset categories for the Digital Library "Quick Drop" + grouping.
export const ASSET_CATEGORIES = [
  "Master Audio",
  "Teaser",
  "MV Export",
  "Stems",
  "Artwork",
  "Other",
] as const;

// Assignable roles for a template's default owner.
export const TEMPLATE_ROLES = [
  "Unassigned",
  "Promoter",
  "Creative/MarCom",
  "Graphics",
  "Producer",
  "Digital",
  "Distributor",
] as const;
