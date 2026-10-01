import { FinanceDashboard } from "@/components/finance/finance-dashboard";
import { getFinanceSummary } from "@/lib/queries";

export default async function FinancePage() {
  const rows = await getFinanceSummary();
  return <FinanceDashboard rows={rows} />;
}
