import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays } from "lucide-react";

import { formatFull, parseDate } from "@/lib/dates";
import { getProjectById } from "@/lib/queries";
import { FinanceTab } from "@/components/dashboard/project-details-sheet";

/** Per-project finance page — the full CBS Budget-vs-Actual ledger + splits,
 *  deep-linkable for the Finance dashboard and the portal. */
export default async function ProjectFinancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProjectById(id);
  if (!project) notFound();

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-6">
      <header className="space-y-3">
        <Link
          href="/finance"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          กลับสู่ Finance
        </Link>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {project.songName}
            <span className="ml-2 text-base font-normal text-muted-foreground">
              · การเงิน
            </span>
          </h1>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            {project.artistName} · {project.label}
            {project.releaseDate && (
              <span className="inline-flex items-center gap-1">
                · <CalendarDays className="size-3.5" />
                {formatFull(parseDate(project.releaseDate))}
              </span>
            )}
          </p>
        </div>
      </header>

      <FinanceTab project={project} />
    </div>
  );
}
