import { TemplatesManager } from "@/components/settings/templates-manager";
import { getCurrentUserEmail, getTaskTemplates } from "@/lib/queries";

export default async function TemplatesSettingsPage() {
  const [templates, userEmail] = await Promise.all([
    getTaskTemplates(),
    getCurrentUserEmail(),
  ]);
  return (
    <TemplatesManager initialTemplates={templates} userEmail={userEmail} />
  );
}
