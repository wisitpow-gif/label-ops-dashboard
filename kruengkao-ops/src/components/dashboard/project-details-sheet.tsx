"use client";

import * as React from "react";
import {
  CalendarDays,
  CircleCheck,
  Download,
  ExternalLink,
  Plus,
  Trash2,
  TriangleAlert,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { formatFull, parseDate } from "@/lib/dates";
import { EXPENSE_GROUP_ORDER, UNGROUPED_EXPENSE } from "@/lib/constants";
import {
  SPLIT_ROLES,
  TASK_GROUPS,
  financeOf,
  packStatus,
} from "@/lib/mock-data";
import type {
  PayeeType,
  ProductionExpense,
  Project,
  SplitEntry,
  Task,
} from "@/lib/types";
import {
  createProjectExpense,
  deleteProjectExpense,
  listProjectExpenses,
  updateProjectExpense,
  type UpdateExpenseInput,
} from "@/app/actions";
import { StatusBadge } from "./status-badge";

const thb = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  minimumFractionDigits: 2,
});

function toNum(s: string): number {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

// PAYEES.payee_type options (Blueprint Part 4.1 / Part 5)
const PAYEE_TYPES: { value: PayeeType; label: string }[] = [
  { value: "Individual", label: "Individual (บุคคลธรรมดา)" },
  { value: "Company", label: "Company/Studio (นิติบุคคล)" },
  { value: "Band", label: "Band (วงดนตรี)" },
];

function PayeeTypeSelect({
  value,
  onChange,
}: {
  value: PayeeType;
  onChange: (next: PayeeType) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as PayeeType)}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Type" />
      </SelectTrigger>
      <SelectContent>
        {PAYEE_TYPES.map((t) => (
          <SelectItem key={t.value} value={t.value}>
            {t.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ---------------------------------------------------------------------------
// Section 1: Production Expenses — Budget vs Actual, grouped by CBS
// ---------------------------------------------------------------------------

const isHttp = (s?: string) =>
  !!s && s.trim().toLowerCase().startsWith("http");

function ProductionExpensesSection({
  projectId,
  expenses,
  onChange,
  onReload,
}: {
  projectId: string;
  expenses: ProductionExpense[];
  onChange: (next: ProductionExpense[]) => void;
  /** Re-fetch from the server (used to resync after a failed write). */
  onReload: () => void;
}) {
  // Local edit — instant UI; persistence happens on blur / toggle.
  const patchLocal = (id: string, partial: Partial<ProductionExpense>) =>
    onChange(expenses.map((e) => (e.id === id ? { ...e, ...partial } : e)));

  const commit = (id: string, patch: UpdateExpenseInput) => {
    updateProjectExpense(id, patch).catch((err) => {
      console.error("[expenses] update failed:", err);
      toast.error("บันทึกค่าใช้จ่ายไม่สำเร็จ");
      onReload();
    });
  };

  const addRow = async (group: string) => {
    try {
      const created = await createProjectExpense({
        projectId,
        expenseGroup: group,
      });
      onChange([...expenses, created]);
    } catch (err) {
      console.error("[expenses] add failed:", err);
      toast.error("เพิ่มรายการไม่สำเร็จ");
    }
  };

  const removeRow = async (id: string) => {
    const prev = expenses;
    onChange(expenses.filter((e) => e.id !== id)); // optimistic
    try {
      await deleteProjectExpense(id);
    } catch (err) {
      console.error("[expenses] delete failed:", err);
      toast.error("ลบรายการไม่สำเร็จ");
      onChange(prev);
    }
  };

  // Always show the canonical CBS groups (so "+ Add Expense" is available even
  // before rows exist), plus any extra groups present in the data.
  const grouped = React.useMemo(() => {
    const byGroup = new Map<string, ProductionExpense[]>();
    for (const e of expenses) {
      const g = e.expenseGroup || UNGROUPED_EXPENSE;
      if (!byGroup.has(g)) byGroup.set(g, []);
      byGroup.get(g)!.push(e);
    }
    const order = EXPENSE_GROUP_ORDER as readonly string[];
    const names = [...new Set([...order, ...byGroup.keys()])];
    const rank = (g: string) => {
      const i = order.indexOf(g);
      return i === -1 ? order.length : i;
    };
    return names
      .toSorted((a, b) => rank(a) - rank(b) || a.localeCompare(b))
      .map((group) => ({ group, rows: byGroup.get(group) ?? [] }));
  }, [expenses]);

  const totalBudget = expenses.reduce((a, e) => a + e.budgetedAmount, 0);
  const totalActual = expenses.reduce((a, e) => a + e.actualAmount, 0);
  const totalVerified = expenses.reduce((a, e) => a + e.verifiedAmount, 0);
  // Variance against the final settled truth (Accounting-verified).
  const variance = totalBudget - totalVerified;

  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold">
          Production Expenses · Budget vs Actual
        </h3>
        <p className="text-xs text-muted-foreground">
          งบประมาณเทียบยอดจ่ายจริง จัดกลุ่มตามโครงสร้างต้นทุน (CBS) — แก้ไขแล้วบันทึกอัตโนมัติ
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="min-w-60">Description</TableHead>
              <TableHead className="min-w-52">Payee</TableHead>
              <TableHead className="w-28 text-right">Budget</TableHead>
              <TableHead className="w-32 text-right">ใช้จริง (Producer)</TableHead>
              <TableHead className="w-32 text-right">เกิดจริง (Account)</TableHead>
              <TableHead className="w-48">Evidence Link</TableHead>
              <TableHead className="w-16 text-center">Recoup?</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {grouped.map(({ group, rows }) => {
              const gBudget = rows.reduce((a, e) => a + e.budgetedAmount, 0);
              const gActual = rows.reduce((a, e) => a + e.actualAmount, 0);
              const gVerified = rows.reduce((a, e) => a + e.verifiedAmount, 0);
              return (
                <React.Fragment key={group}>
                  {/* Group header + subtotals + add-within-group */}
                  <TableRow className="border-t-2 bg-muted/40 hover:bg-muted/40">
                    <TableCell colSpan={2} className="py-2 font-semibold">
                      {group}
                    </TableCell>
                    <TableCell className="py-2 text-right text-xs tabular-nums text-muted-foreground">
                      {thb.format(gBudget)}
                    </TableCell>
                    <TableCell className="py-2 text-right text-xs tabular-nums text-muted-foreground">
                      {thb.format(gActual)}
                    </TableCell>
                    <TableCell className="py-2 text-right text-xs tabular-nums text-muted-foreground">
                      {thb.format(gVerified)}
                    </TableCell>
                    <TableCell colSpan={3} className="py-1.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-muted-foreground"
                        onClick={() => addRow(group)}
                      >
                        <Plus className="size-3.5" />
                        Add Expense
                      </Button>
                    </TableCell>
                  </TableRow>
                  {rows.map((e) => (
                    <TableRow key={e.id} className="hover:bg-transparent">
                      <TableCell className="p-2 align-top">
                        <Input
                          placeholder="รายละเอียด"
                          value={e.description}
                          onChange={(ev) =>
                            patchLocal(e.id, { description: ev.target.value })
                          }
                          onBlur={(ev) =>
                            commit(e.id, { description: ev.target.value })
                          }
                        />
                      </TableCell>
                      <TableCell className="p-2 align-top">
                        {/* Payee + payment note stacked so they never overlap */}
                        <div className="flex flex-col gap-1.5">
                          <Input
                            placeholder="ผู้รับเงิน"
                            value={e.payeeName}
                            onChange={(ev) =>
                              patchLocal(e.id, { payeeName: ev.target.value })
                            }
                            onBlur={(ev) =>
                              commit(e.id, { payeeName: ev.target.value })
                            }
                          />
                          <Input
                            placeholder="payment note (งวด/เงื่อนไข)"
                            value={e.paymentNote ?? ""}
                            onChange={(ev) =>
                              patchLocal(e.id, { paymentNote: ev.target.value })
                            }
                            onBlur={(ev) =>
                              commit(e.id, { paymentNote: ev.target.value })
                            }
                            className="h-7 text-xs text-muted-foreground"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="p-2 align-top">
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          className="text-right tabular-nums"
                          value={e.budgetedAmount}
                          onFocus={(ev) => ev.target.select()}
                          onChange={(ev) =>
                            patchLocal(e.id, {
                              budgetedAmount: toNum(ev.target.value),
                            })
                          }
                          onBlur={(ev) =>
                            commit(e.id, {
                              budgetedAmount: toNum(ev.target.value),
                            })
                          }
                        />
                      </TableCell>
                      <TableCell className="p-2 align-top">
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          className="text-right tabular-nums"
                          value={e.actualAmount}
                          onFocus={(ev) => ev.target.select()}
                          onChange={(ev) =>
                            patchLocal(e.id, {
                              actualAmount: toNum(ev.target.value),
                            })
                          }
                          onBlur={(ev) =>
                            commit(e.id, { actualAmount: toNum(ev.target.value) })
                          }
                        />
                      </TableCell>
                      <TableCell className="p-2 align-top">
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          className="text-right tabular-nums"
                          value={e.verifiedAmount}
                          onFocus={(ev) => ev.target.select()}
                          onChange={(ev) =>
                            patchLocal(e.id, {
                              verifiedAmount: toNum(ev.target.value),
                            })
                          }
                          onBlur={(ev) =>
                            commit(e.id, {
                              verifiedAmount: toNum(ev.target.value),
                            })
                          }
                        />
                      </TableCell>
                      <TableCell className="p-2 align-top">
                        <div className="flex items-center gap-1">
                          <Input
                            placeholder="ลิงก์ใบเสร็จ/หลักฐาน"
                            value={e.evidenceUrl ?? ""}
                            onChange={(ev) =>
                              patchLocal(e.id, { evidenceUrl: ev.target.value })
                            }
                            onBlur={(ev) =>
                              commit(e.id, { evidenceUrl: ev.target.value })
                            }
                            className="min-w-0"
                          />
                          {isHttp(e.evidenceUrl) && (
                            <Button
                              asChild
                              variant="ghost"
                              size="icon"
                              className="size-8 shrink-0 text-muted-foreground"
                              aria-label="เปิดลิงก์หลักฐาน"
                            >
                              <a
                                href={e.evidenceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="size-4" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="p-2 text-center align-top">
                        <Checkbox
                          checked={e.isRecoupable}
                          onCheckedChange={(checked) => {
                            const value = checked === true;
                            patchLocal(e.id, { isRecoupable: value });
                            commit(e.id, { isRecoupable: value });
                          }}
                          aria-label="Recoupable"
                        />
                      </TableCell>
                      <TableCell className="p-2 align-top">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          aria-label="ลบรายการ"
                          onClick={() => removeRow(e.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Grand totals + variance (Maker vs Checker) */}
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <div className="rounded-lg border px-3 py-2">
          <div className="text-xs text-muted-foreground">Total Budget</div>
          <div className="text-sm font-semibold tabular-nums">
            {thb.format(totalBudget)}
          </div>
        </div>
        <div className="rounded-lg border px-3 py-2">
          <div className="text-xs text-muted-foreground">
            รวมใช้จริง (Producer)
          </div>
          <div className="text-sm font-semibold tabular-nums">
            {thb.format(totalActual)}
          </div>
        </div>
        <div className="rounded-lg border px-3 py-2">
          <div className="text-xs text-muted-foreground">
            รวมเกิดจริง (Account)
          </div>
          <div className="text-sm font-semibold tabular-nums">
            {thb.format(totalVerified)}
          </div>
        </div>
        <div
          className={cn(
            "rounded-lg border px-3 py-2",
            variance < 0
              ? "border-red-500/40 bg-red-500/10"
              : "border-emerald-500/40 bg-emerald-500/10"
          )}
        >
          <div className="text-xs text-muted-foreground">
            Variance (Budget − เกิดจริง)
          </div>
          <div
            className={cn(
              "text-sm font-semibold tabular-nums",
              variance < 0
                ? "text-red-700 dark:text-red-400"
                : "text-emerald-700 dark:text-emerald-400"
            )}
          >
            {thb.format(variance)}
            {variance < 0 ? " · เกินงบ" : ""}
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Section 2: Royalty Splits (strict 100% validation)
// ---------------------------------------------------------------------------

function SplitsSection({
  splits,
  total,
  isBalanced,
  onChange,
}: {
  splits: SplitEntry[];
  total: number;
  isBalanced: boolean;
  onChange: (next: SplitEntry[]) => void;
}) {
  const update = (id: string, patch: Partial<SplitEntry>) =>
    onChange(splits.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold">Royalty Splits</h3>
        <p className="text-xs text-muted-foreground">
          สัดส่วนส่วนแบ่งจาก Net Revenue หลังหักทุนคืน — ผลรวมต้องเท่ากับ 100.00%
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-32">Role</TableHead>
              <TableHead className="w-48">Payee Type</TableHead>
              <TableHead className="w-52">Name</TableHead>
              <TableHead className="w-24 text-right">%</TableHead>
              {/* Note takes the remaining flexible width */}
              <TableHead>Note / เงื่อนไขการจ่าย</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {splits.map((s) => (
              <TableRow key={s.id} className="hover:bg-transparent">
                <TableCell className="p-2">
                  <Select
                    value={s.role}
                    onValueChange={(v) => update(s.id, { role: v })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      {SPLIT_ROLES.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="p-2">
                  <PayeeTypeSelect
                    value={s.payeeType}
                    onChange={(payeeType) => update(s.id, { payeeType })}
                  />
                </TableCell>
                <TableCell className="p-2">
                  <Input
                    placeholder="ชื่อผู้รับส่วนแบ่ง"
                    value={s.name}
                    onChange={(ev) => update(s.id, { name: ev.target.value })}
                  />
                </TableCell>
                <TableCell className="p-2">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    placeholder="0.00"
                    className="text-right tabular-nums"
                    value={s.percentage}
                    onChange={(ev) =>
                      update(s.id, { percentage: ev.target.value })
                    }
                  />
                </TableCell>
                <TableCell className="p-2">
                  <Input
                    placeholder="เช่น สมาชิก 4 คนแบ่งเท่าๆกัน"
                    value={s.note}
                    onChange={(ev) => update(s.id, { note: ev.target.value })}
                  />
                </TableCell>
                <TableCell className="p-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="ลบแถวนี้"
                    disabled={splits.length <= 1}
                    onClick={() => onChange(splits.filter((x) => x.id !== s.id))}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            onChange([
              ...splits,
              {
                id: crypto.randomUUID(),
                role: "",
                payeeType: "Individual",
                name: "",
                percentage: "",
                note: "",
              },
            ])
          }
        >
          <UserPlus data-icon="inline-start" />
          Add Contributor
        </Button>
      </div>

      {/* Real-time sum + strict 100% validation */}
      <div
        className={cn(
          "flex items-center justify-between rounded-lg border px-3 py-2",
          isBalanced
            ? "border-emerald-500/40 bg-emerald-500/10"
            : "border-red-500/40 bg-red-500/10"
        )}
      >
        <div
          className={cn(
            "flex items-center gap-2 text-sm",
            isBalanced
              ? "text-emerald-700 dark:text-emerald-400"
              : "text-red-700 dark:text-red-400"
          )}
        >
          {isBalanced ? (
            <>
              <CircleCheck className="size-4" />
              ครบ 100.00% — พร้อมบันทึก
            </>
          ) : (
            <>
              <TriangleAlert className="size-4" />
              ผลรวมต้องเท่ากับ 100.00% ({total > 100 ? "เกิน" : "ขาด"}อยู่{" "}
              {Math.abs(Math.round((100 - total) * 100) / 100)}%)
            </>
          )}
        </div>
        <span
          className={cn(
            "text-sm font-semibold tabular-nums",
            isBalanced
              ? "text-emerald-700 dark:text-emerald-400"
              : "text-red-700 dark:text-red-400"
          )}
        >
          {total.toFixed(2)}%
        </span>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Finance & Splits tab (Phase 2)
// ---------------------------------------------------------------------------

function FinanceTab({ project }: { project: Project }) {
  // Production expenses are DB-backed; royalty splits stay local for now.
  const [expenses, setExpenses] = React.useState<ProductionExpense[]>([]);
  const [loadingExpenses, setLoadingExpenses] = React.useState(true);
  const [splits, setSplits] = React.useState<SplitEntry[]>(
    () => financeOf(project.id).splits
  );
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    listProjectExpenses(project.id)
      .then((rows) => {
        if (active) {
          setExpenses(rows);
          setLoadingExpenses(false);
        }
      })
      .catch((err) => {
        console.error("[FinanceTab] load expenses failed:", err);
        if (active) setLoadingExpenses(false);
      });
    return () => {
      active = false;
    };
  }, [project.id]);

  const reloadExpenses = () => {
    listProjectExpenses(project.id)
      .then(setExpenses)
      .catch((err) => console.error("[FinanceTab] reload failed:", err));
  };

  const total =
    Math.round(splits.reduce((acc, s) => acc + toNum(s.percentage), 0) * 100) /
    100;
  const isBalanced = total === 100;

  function handleSave() {
    // TODO(Supabase phase): persist SONG_SPLITS (expenses already autosave).
    console.log("Save royalty splits:", { projectId: project.id, splits });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleExport() {
    // CSV for the accounting team (BOM so Excel reads Thai correctly)
    const lines = [
      `Project,${project.songName},${project.artistName},${project.label}`,
      "",
      "PRODUCTION EXPENSES",
      "Group,Description,Payee,Budget,Actual (Producer),Verified (Account),Recoupable,Evidence",
      ...expenses.map(
        (e) =>
          `"${e.expenseGroup}","${e.description}","${e.payeeName}",${e.budgetedAmount.toFixed(2)},${e.actualAmount.toFixed(2)},${e.verifiedAmount.toFixed(2)},${e.isRecoupable ? "Yes" : "No"},"${e.evidenceUrl ?? ""}"`
      ),
      `,,Total,${expenses.reduce((a, e) => a + e.budgetedAmount, 0).toFixed(2)},${expenses.reduce((a, e) => a + e.actualAmount, 0).toFixed(2)},${expenses.reduce((a, e) => a + e.verifiedAmount, 0).toFixed(2)},,`,
      "",
      "ROYALTY SPLITS",
      "Role,Payee Type,Name,Percentage,Note",
      ...splits.map(
        (s) =>
          `${s.role},${s.payeeType},"${s.name}",${toNum(s.percentage).toFixed(2)},"${s.note}"`
      ),
    ];
    const blob = new Blob(["\uFEFF" + lines.join("\r\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `finance-${project.songName}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {loadingExpenses ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          \u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14\u0E04\u0E48\u0E32\u0E43\u0E0A\u0E49\u0E08\u0E48\u0E32\u0E22\u2026
        </p>
      ) : (
        <ProductionExpensesSection
          projectId={project.id}
          expenses={expenses}
          onChange={setExpenses}
          onReload={reloadExpenses}
        />
      )}
      <Separator />
      <SplitsSection
        splits={splits}
        total={total}
        isBalanced={isBalanced}
        onChange={setSplits}
      />

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button type="button" variant="outline" onClick={handleExport}>
          <Download data-icon="inline-start" />
          Export for Accounting
        </Button>
        <Button type="button" disabled={!isBalanced} onClick={handleSave}>
          {saved ? (
            <>
              <CircleCheck data-icon="inline-start" />
              Saved!
            </>
          ) : (
            "Save Splits"
          )}
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Overview tab (light summary so the sheet feels complete)
// ---------------------------------------------------------------------------

function OverviewTab({ project, tasks }: { project: Project; tasks: Task[] }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg border p-3">
          <div className="text-xs text-muted-foreground">Artist</div>
          <div className="font-medium">{project.artistName}</div>
        </div>
        <div className="rounded-lg border p-3">
          <div className="text-xs text-muted-foreground">Label</div>
          <div className="font-medium">{project.label}</div>
        </div>
        <div className="col-span-2 rounded-lg border p-3">
          <div className="text-xs text-muted-foreground">Release Date</div>
          <div className="flex items-center gap-1.5 font-medium">
            <CalendarDays className="size-4 text-muted-foreground" />
            {formatFull(parseDate(project.releaseDate))}
          </div>
        </div>
      </div>
      <div className="space-y-2">
        {TASK_GROUPS.map((group) => {
          const groupTasks = tasks.filter((t) => t.group === group);
          const done = groupTasks.filter((t) => t.status === "Done").length;
          return (
            <div
              key={group}
              className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
            >
              <span>{group}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs tabular-nums text-muted-foreground">
                  {done}/{groupTasks.length}
                </span>
                <StatusBadge status={packStatus(groupTasks)} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The slide-over panel
// ---------------------------------------------------------------------------

export function ProjectDetailsSheet({
  project,
  tasks,
  onOpenChange,
}: {
  project: Project | null;
  tasks: Task[];
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={!!project} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto data-[side=right]:w-[90vw] data-[side=right]:sm:max-w-[1000px]">
        {project && (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                {project.songName}
                <Badge variant="secondary">{project.label}</Badge>
              </SheetTitle>
              <SheetDescription>
                {project.artistName} · ปล่อย{" "}
                {formatFull(parseDate(project.releaseDate))}
              </SheetDescription>
            </SheetHeader>

            <div className="px-4 pb-6">
              {/* key resets unsaved edits when switching projects */}
              <Tabs defaultValue="finance" key={project.id}>
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="finance">Finance & Splits</TabsTrigger>
                  <TabsTrigger value="files" disabled>
                    Files (Phase 3)
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="pt-3">
                  <OverviewTab
                    project={project}
                    tasks={tasks.filter((t) => t.projectId === project.id)}
                  />
                </TabsContent>
                <TabsContent value="finance" className="pt-3">
                  <FinanceTab project={project} />
                </TabsContent>
              </Tabs>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
