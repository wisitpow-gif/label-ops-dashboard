import { TeamSettings } from "@/components/settings/team-settings";
import { getCurrentUserEmail, getTeamMembers } from "@/lib/queries";

export default async function SettingsPage() {
  const [members, userEmail] = await Promise.all([
    getTeamMembers(),
    getCurrentUserEmail(),
  ]);
  return <TeamSettings initialMembers={members} userEmail={userEmail} />;
}
