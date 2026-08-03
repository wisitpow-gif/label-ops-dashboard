import type { TeamMember } from "./types";

/** A role (department) and the people in it — the shape the UI dropdowns want. */
export interface RoleGroup {
  role: string;
  members: string[];
}

// Canonical department order so dropdowns/columns stay stable regardless of
// insertion order. Roles not listed here sort after these, alphabetically.
export const TEAM_ROLES = [
  "Promoter",
  "Creative/MarCom",
  "Graphics",
  "Producer",
  "Digital",
  "Distributor",
] as const;

const ROLE_ORDER = new Map<string, number>(TEAM_ROLES.map((r, i) => [r, i]));

function roleRank(role: string): number {
  return ROLE_ORDER.has(role) ? ROLE_ORDER.get(role)! : TEAM_ROLES.length;
}

/** Group a flat team-member list into ordered Role → members buckets. */
export function toRoleGroups(members: TeamMember[]): RoleGroup[] {
  const byRole = new Map<string, string[]>();
  for (const m of members) {
    if (!byRole.has(m.role)) byRole.set(m.role, []);
    byRole.get(m.role)!.push(m.name);
  }
  return [...byRole.entries()]
    .sort(([a], [b]) => roleRank(a) - roleRank(b) || a.localeCompare(b))
    .map(([role, names]) => ({
      role,
      members: [...names].sort((a, b) => a.localeCompare(b)),
    }));
}

/** Members of one role within a set of groups ([] if the role is unknown). */
export function membersOfRoleIn(groups: RoleGroup[], role: string): string[] {
  return groups.find((g) => g.role === role)?.members ?? [];
}
