// Small date helpers shared by the table and Gantt views.
// NOTE: the real Workback Engine (Blueprint Part 3.1) will be holiday-aware;
// for the UI scaffold we use plain calendar-day math.

export function parseDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function diffDays(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

const thaiShort = new Intl.DateTimeFormat("th-TH", {
  day: "numeric",
  month: "short",
});

const thaiFull = new Intl.DateTimeFormat("th-TH", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function formatShort(date: Date): string {
  return thaiShort.format(date);
}

export function formatFull(date: Date): string {
  return thaiFull.format(date);
}
