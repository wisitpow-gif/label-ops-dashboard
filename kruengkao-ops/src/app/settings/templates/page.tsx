import { TemplatesManager } from "@/components/settings/templates-manager";
import { getTaskTemplates } from "@/lib/queries";

export default async function TemplatesSettingsPage() {
  const templates = await getTaskTemplates();
  return <TemplatesManager initialTemplates={templates} />;
}
