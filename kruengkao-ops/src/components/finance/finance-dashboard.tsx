import Link from "next/link";
import { ChevronRight, Wallet } from "lucide-react";

import { cn } from "@/lib/utils";
import type { FinanceSummaryRow } from "@/lib/queries";

const thb = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/**
 * Cross-project finance rollup (Budget vs Actual vs Verified). The data is
 * still project-scoped — each row links to that project's full finance page.
 */
export function FinanceDashboard({ rows }: { rows: FinanceSummaryRow[] }) {
  const total = rows.reduce(
    (a, r) => ({
      budgeted: a.budgeted + r.budgeted,
      actual: a.actual + r.actual,
      verified: a.verified + r.verified,
      recoupable: a.recoupable + r.recoupable,
    }),
    { budgeted: 0, actual: 0, verified: 0, recoupable: 0 }
  );
  const totalVariance = total.budgeted - total.verified;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-foreground text-background">
          <Wallet className="size-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Finance</h1>
          <p className="text-sm text-muted-foreground">
            ภาพรวมงบประมาณทุกโปรเจกต์ · งบ / ใช้จริง / เกิดจริง / Variance
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed py-16 text-center text-sm text-muted-foreground">
          ยังไม่มีข้อมูลการเงิน
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="px-3 py-2 font-medium">เพลง</th>
                <th className="px-3 py-2 font-medium">สังกัด</th>
                <th className="px-3 py-2 text-right font-medium">งบ</th>
                <th className="px-3 py-2 text-right font-medium">ใช้จริง</th>
                <th className="px-3 py-2 text-right font-medium">เกิดจริง</th>
                <th className="px-3 py-2 text-right font-medium">Variance</th>
                <th className="w-8 px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map(({ project, budgeted, actual, verified }) => {
                const variance = budgeted - verified;
                return (
                  <tr
                    key={project.id}
                    className="border-b transition-colors hover:bg-muted/40"
                  >
                    <td className="px-3 py-2">
                      <Link
                        href={`/projects/${project.id}/finance`}
                        className="font-medium hover:underline"
                      >
                        {project.songName}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        {project.artistName}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {project.label}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {thb.format(budgeted)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {thb.format(actual)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {thb.format(verified)}
                    </td>
                    <td
                      className={cn(
                        "px-3 py-2 text-right font-medium tabular-nums",
                        variance < 0
                          ? "text-red-600 dark:text-red-400"
                          : "text-emerald-600 dark:text-emerald-400"
                      )}
                    >
                      {thb.format(variance)}
                    </td>
                    <td className="px-3 py-2">
                      <Link
                        href={`/projects/${project.id}/finance`}
                        aria-label={`เปิดการเงินของ ${project.songName}`}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ChevronRight className="size-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-muted/40 font-semibold">
                <td className="px-3 py-2" colSpan={2}>
                  รวมทั้งหมด
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {thb.format(total.budgeted)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {thb.format(total.actual)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {thb.format(total.verified)}
                </td>
                <td
                  className={cn(
                    "px-3 py-2 text-right tabular-nums",
                    totalVariance < 0
                      ? "text-red-600 dark:text-red-400"
                      : "text-emerald-600 dark:text-emerald-400"
                  )}
                >
                  {thb.format(totalVariance)}
                </td>
                <td className="px-3 py-2" />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </section>
  );
}
