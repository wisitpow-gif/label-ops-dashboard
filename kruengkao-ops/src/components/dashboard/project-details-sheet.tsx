"use client";

import * as React from "react";
import {
  CalendarDays,
  CircleCheck,
  Download,
  Plus,
  Trash2,
  TriangleAlert,
  UserPlus,
} from "lucide-react";

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
import {
  SPLIT_ROLES,
  TASK_GROUPS,
  financeOf,
  packStatus,
} from "@/lib/mock-data";
import type {
  ExpenseEntry,
  PayeeType,
  Project,
  SplitEntry,
  Task,
} from "@/lib/types";
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
// Section 1: Production Expenses (Recoupable Ledger)
// ---------------------------------------------------------------------------

function ExpensesSection({
  expenses,
  onChange,
}: {
  expenses: ExpenseEntry[];
  onChange: (next: ExpenseEntry[]) => void;
}) {
  const update = (id: string, patch: Partial<ExpenseEntry>) =>
    onChange(expenses.map((e) => (e.id === id ? { ...e, ...patch } : e)));

  const total = expenses.reduce((acc, e) => acc + toNum(e.amount), 0);
  const recoupable = expenses
    .filter((e) => e.isRecoupable)
    .reduce((acc, e) => acc + toNum(e.amount), 0);

  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold">
          Production Expenses · Recoupable Ledger
        </h3>
        <p className="text-xs text-muted-foreground">
          รายจ่ายที่ติ๊ก Recoup จะถูกหักคืนจากรายได้ก่อนแบ่งส่วนแบ่ง (Blueprint 4.2)
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead>Description</TableHead>
              <TableHead className="w-48">Payee</TableHead>
              <TableHead className="w-48">Type</TableHead>
              <TableHead className="w-32 text-right">Amount (THB)</TableHead>
              <TableHead className="w-20 text-center">Recoup?</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((e) => (
              <TableRow key={e.id} className="hover:bg-transparent">
                <TableCell className="p-2">
                  <Input
                    placeholder="เช่น ค่าห้องอัด, ค่า Arrange"
                    value={e.description}
                    onChange={(ev) =>
                      update(e.id, { description: ev.target.value })
                    }
                  />
                </TableCell>
                <TableCell className="p-2">
                  <Input
                    placeholder="ชื่อผู้รับเงิน"
                    value={e.payeeName}
                    onChange={(ev) =>
                      update(e.id, { payeeName: ev.target.value })
                    }
                  />
                </TableCell>
                <TableCell className="p-2">
                  <PayeeTypeSelect
                    value={e.payeeType}
                    onChange={(payeeType) => update(e.id, { payeeType })}
                  />
                </TableCell>
                <TableCell className="p-2">
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="0.00"
                    className="text-right tabular-nums"
                    value={e.amount}
                    onChange={(ev) => update(e.id, { amount: ev.target.value })}
                  />
                </TableCell>
                <TableCell className="p-2 text-center">
                  <Checkbox
                    checked={e.isRecoupable}
                    onCheckedChange={(checked) =>
                      update(e.id, { isRecoupable: checked === true })
                    }
                    aria-label="นำไปหักคืนทุน (Recoupable)"
                  />
                </TableCell>
                <TableCell className="p-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="ลบรายการ"
                    disabled={expenses.length <= 1}
                    onClick={() =>
                      onChange(expenses.filter((x) => x.id !== e.id))
                    }
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
              ...expenses,
              {
                id: crypto.randomUUID(),
                description: "",
                payeeName: "",
                payeeType: "Individual",
                amount: "",
                isRecoupable: true,
              },
            ])
          }
        >
          <Plus data-icon="inline-start" />
          Add Expense
        </Button>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">
            รวมทั้งหมด{" "}
            <span className="font-medium tabular-nums text-foreground">
              {thb.format(total)}
            </span>
          </span>
          <Badge variant="outline" className="tabular-nums">
            Recoupable: {thb.format(recoupable)}
          </Badge>
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
  const [finance, setFinance] = React.useState(() => financeOf(project.id));
  const [saved, setSaved] = React.useState(false);

  const total =
    Math.round(
      finance.splits.reduce((acc, s) => acc + toNum(s.percentage), 0) * 100
    ) / 100;
  const isBalanced = total === 100;

  function handleSave() {
    // TODO(Supabase phase): upsert PROJECT_EXPENSES + SONG_SPLITS
    console.log("Save financial setup:", { projectId: project.id, ...finance });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleExport() {
    // CSV for the accounting team (BOM so Excel reads Thai correctly)
    const lines = [
      `Project,${project.songName},${project.artistName},${project.label}`,
      "",
      "PRODUCTION EXPENSES",
      "Description,Payee,Type,Amount (THB),Recoupable",
      ...finance.expenses.map(
        (e) =>
          `"${e.description}","${e.payeeName}",${e.payeeType},${toNum(e.amount).toFixed(2)},${e.isRecoupable ? "Yes" : "No"}`
      ),
      "",
      "ROYALTY SPLITS",
      "Role,Payee Type,Name,Percentage,Note",
      ...finance.splits.map(
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
      <ExpensesSection
        expenses={finance.expenses}
        onChange={(expenses) => setFinance((f) => ({ ...f, expenses }))}
      />
      <Separator />
      <SplitsSection
        splits={finance.splits}
        total={total}
        isBalanced={isBalanced}
        onChange={(splits) => setFinance((f) => ({ ...f, splits }))}
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
            "Save Financial Setup"
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
