"use client";

import * as React from "react";
import type { RoleGroup } from "@/lib/team";
import { membersOfRoleIn } from "@/lib/team";

interface TeamContextValue {
  groups: RoleGroup[];
  /** People in a role (empty if the role has none / is unknown). */
  membersOfRole: (role: string) => string[];
  /** Flat, de-duplicated roster in group order. */
  people: string[];
}

const TeamContext = React.createContext<TeamContextValue | null>(null);

/**
 * Provides the DB-backed team roster to the client tree. Each page fetches
 * team members server-side and wraps its board in this provider so every
 * assignment dropdown reads the same live roster.
 */
export function TeamProvider({
  groups,
  children,
}: {
  groups: RoleGroup[];
  children: React.ReactNode;
}) {
  const value = React.useMemo<TeamContextValue>(() => {
    const seen = new Set<string>();
    const people: string[] = [];
    for (const g of groups) {
      for (const m of g.members) {
        if (!seen.has(m)) {
          seen.add(m);
          people.push(m);
        }
      }
    }
    return {
      groups,
      people,
      membersOfRole: (role: string) => membersOfRoleIn(groups, role),
    };
  }, [groups]);

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
}

/** Read the team roster. Falls back to an empty roster if no provider is present. */
export function useTeam(): TeamContextValue {
  const ctx = React.useContext(TeamContext);
  return ctx ?? { groups: [], people: [], membersOfRole: () => [] };
}
