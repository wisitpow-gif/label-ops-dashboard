const pptxgen = require("pptxgenjs");
const p = new pptxgen();
p.layout = "LAYOUT_WIDE"; // 13.33 x 7.5
p.author = "บริษัท ครึ่งเก้า";
p.company = "บริษัท ครึ่งเก้า";

// ── Palette ────────────────────────────────────────────────────────────────
const NAVY = "161A3B";
const NAVY2 = "28315F";
const AMBER = "F2B705";
const ICE = "CFD8F5";
const WHITE = "FFFFFF";
const CARD = "F5F7FB";
const BORDER = "E3E7F2";
const INK = "1A1D2B";
const MUTED = "5B6176";
const EMERALD = "1FA97A";
const RED = "E5484D";
const VIOLET = "6D5AE0";
const TEAL = "128E7C";
const BLUE = "2E6BE6";
const F = "Tahoma";

const W = 13.33;
const sh = () => ({ type: "outer", color: "9AA3C0", blur: 8, offset: 3, angle: 90, opacity: 0.25 });

function titleBlock(s, kicker, title, dark) {
  s.addText(kicker, {
    x: 0.6, y: 0.42, w: 12.1, h: 0.3, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 12, bold: true, charSpacing: 2,
    color: dark ? AMBER : AMBER, align: "left",
  });
  s.addText(title, {
    x: 0.6, y: 0.72, w: 12.1, h: 0.75, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 30, bold: true, color: dark ? WHITE : INK, align: "left",
  });
}

// ── 1. Title (dark) ─────────────────────────────────────────────────────────
let s = p.addSlide();
s.background = { color: NAVY };
s.addShape(p.ShapeType.ellipse, { x: 10.3, y: -2.2, w: 5.6, h: 5.6, fill: { color: NAVY2 } });
s.addShape(p.ShapeType.ellipse, { x: 11.6, y: 4.6, w: 4.2, h: 4.2, fill: { color: "1F264B" } });
s.addText("บริษัท ครึ่งเก้า · INTERNAL PLATFORM", {
  x: 0.85, y: 1.7, w: 11, h: 0.4, isTextBox: true, margin: 0,
  fontFace: F, fontSize: 13, bold: true, charSpacing: 3, color: AMBER,
});
s.addText("Label Operations System", {
  x: 0.8, y: 2.15, w: 11.6, h: 1.1, isTextBox: true, margin: 0,
  fontFace: F, fontSize: 48, bold: true, color: WHITE,
});
s.addText("ระบบบริหารงานปล่อยเพลงแบบครบวงจร — ตั้งแต่เปิดโปรเจกต์ ไทม์ไลน์ งานทีม คลังไฟล์ ไปจนถึงการเงิน", {
  x: 0.85, y: 3.25, w: 10.8, h: 0.8, isTextBox: true, margin: 0,
  fontFace: F, fontSize: 17, color: ICE,
});
s.addShape(p.ShapeType.line, { x: 0.9, y: 4.35, w: 2.2, h: 0, line: { color: AMBER, width: 2.5 } });
s.addText("ภาพรวมระบบสำหรับนำเสนอภายในองค์กร", {
  x: 0.85, y: 6.55, w: 11, h: 0.35, isTextBox: true, margin: 0,
  fontFace: F, fontSize: 12, color: "8893B8",
});
s.addNotes("เปิดด้วยภาพรวม: นี่คือระบบภายในที่เราพัฒนาเพื่อคุมงานปล่อยเพลงทั้งกระบวนการในที่เดียว");

// ── 2. ปัญหาเดิม ─────────────────────────────────────────────────────────────
s = p.addSlide();
s.background = { color: WHITE };
titleBlock(s, "ทำไมต้องมีระบบนี้", "ปัญหาเดิมของการทำงาน", false);
const pains = [
  ["ติดตามด้วยมือ", "ใช้ Excel / แชต กระจายหลายที่ ตกหล่นและไม่อัปเดตเรียลไทม์", RED],
  ["ข้อมูลกระจัดกระจาย", "ไฟล์ งาน งบประมาณ อยู่คนละระบบ หาข้อมูลข้ามแผนกยาก", AMBER],
  ["มองภาพรวมไม่ออก", "ผู้จัดการไม่เห็นว่างานไหนเลยกำหนด ใครถืองานอะไรอยู่", VIOLET],
  ["งบ vs จ่ายจริงไม่ชัด", "ควบคุมต้นทุนต่อเพลงยาก ไม่มีการตรวจสอบหลักฐานการจ่าย", BLUE],
];
pains.forEach((it, i) => {
  const x = 0.6 + i * 3.06;
  s.addShape(p.ShapeType.roundRect, { x, y: 1.9, w: 2.86, h: 3.9, rectRadius: 0.12, fill: { color: CARD }, line: { color: BORDER, width: 1 }, shadow: sh() });
  s.addShape(p.ShapeType.ellipse, { x: x + 0.28, y: 2.2, w: 0.72, h: 0.72, fill: { color: it[2] } });
  s.addText(String(i + 1), { x: x + 0.28, y: 2.2, w: 0.72, h: 0.72, isTextBox: true, margin: 0, align: "center", valign: "middle", fontFace: F, fontSize: 24, bold: true, color: WHITE });
  s.addText(it[0], { x: x + 0.28, y: 3.15, w: 2.35, h: 0.8, isTextBox: true, margin: 0, fontFace: F, fontSize: 17, bold: true, color: INK });
  s.addText(it[1], { x: x + 0.28, y: 3.95, w: 2.35, h: 1.7, isTextBox: true, margin: 0, fontFace: F, fontSize: 13, color: MUTED });
});
s.addText("ผลลัพธ์: งานล่าช้า ต้นทุนบานปลาย และตัดสินใจบนข้อมูลที่ไม่ครบ", {
  x: 0.6, y: 6.1, w: 12.1, h: 0.5, isTextBox: true, margin: 0, fontFace: F, fontSize: 14, italic: true, bold: true, color: NAVY,
});

// ── 3. ภาพรวมระบบ + stats ────────────────────────────────────────────────────
s = p.addSlide();
s.background = { color: WHITE };
titleBlock(s, "ระบบคืออะไร", "ศูนย์กลางงานปล่อยเพลงในที่เดียว", false);
s.addText("รวมทุกขั้นตอนของการปล่อยเพลง — โปรเจกต์ · งาน · ไฟล์ · การเงิน — ไว้ในระบบเดียวที่ทุกคนในองค์กรเข้าถึงได้ตามสิทธิ์", {
  x: 0.6, y: 1.75, w: 11.8, h: 0.7, isTextBox: true, margin: 0, fontFace: F, fontSize: 16, color: MUTED,
});
const stats = [
  ["8", "โมดูลงานหลัก", NAVY],
  ["Release → Finance", "ครบทั้งกระบวนการ", EMERALD],
  ["Real-time", "อัปเดตสดทุกคน", AMBER],
  ["Google SSO", "เฉพาะคนในองค์กร", VIOLET],
];
stats.forEach((it, i) => {
  const x = 0.6 + i * 3.06;
  s.addShape(p.ShapeType.roundRect, { x, y: 2.75, w: 2.86, h: 1.95, rectRadius: 0.1, fill: { color: NAVY }, shadow: sh() });
  s.addText(it[0], { x: x + 0.2, y: 3.0, w: 2.46, h: 0.95, isTextBox: true, margin: 0, align: "left", valign: "middle", fontFace: F, fontSize: it[1].length > 10 ? 20 : 40, bold: true, color: AMBER });
  s.addText(it[1], { x: x + 0.2, y: 4.0, w: 2.46, h: 0.5, isTextBox: true, margin: 0, fontFace: F, fontSize: 13, color: ICE });
});
// simple pipeline strip
const flow = ["เปิดโปรเจกต์", "ไทม์ไลน์ Workback", "งาน & ทีม", "คลังไฟล์", "การเงิน", "ปล่อยเพลง"];
flow.forEach((t, i) => {
  const x = 0.6 + i * 2.02;
  s.addShape(p.ShapeType.roundRect, { x, y: 5.3, w: 1.78, h: 0.75, rectRadius: 0.08, fill: { color: CARD }, line: { color: BORDER, width: 1 } });
  s.addText(t, { x, y: 5.3, w: 1.78, h: 0.75, isTextBox: true, margin: 0, align: "center", valign: "middle", fontFace: F, fontSize: 11.5, bold: true, color: NAVY });
  if (i < flow.length - 1) s.addText("›", { x: x + 1.74, y: 5.3, w: 0.3, h: 0.75, isTextBox: true, margin: 0, align: "center", valign: "middle", fontFace: F, fontSize: 20, bold: true, color: AMBER });
});
s.addText("Workflow รีลีส 1 เพลง", { x: 0.6, y: 4.95, w: 6, h: 0.3, isTextBox: true, margin: 0, fontFace: F, fontSize: 12, bold: true, color: MUTED });

// ── 4 & 5. โมดูล ─────────────────────────────────────────────────────────────
const modules = [
  ["Command Center", "หน้าสรุปงานด่วนรายวัน · KPI · งานของฉัน (triage)", NAVY],
  ["Release Management", "ตารางรีลีส · Pipeline · Gantt · Calendar · Workload", BLUE],
  ["Collaboration", "มอบหมายงาน · dependency · thread พูดคุยในแต่ละงาน", VIOLET],
  ["Digital Assets (DAM)", "Digital Library ต่อโปรเจกต์ + Library Map แคตตาล็อก", TEAL],
  ["Finance", "งบ/ใช้จริง/เกิดจริง (Maker-Checker) · ส่วนแบ่ง · Export", EMERALD],
  ["Internal / Ad-Hoc", "งานภายในที่ไม่ใช่รีลีส พร้อม dependency", AMBER],
  ["Administration", "ทีมงาน · เทมเพลตงาน · สังกัด/ศิลปิน", "C0564B"],
  ["Platform & Security", "Google SSO เฉพาะองค์กร · RLS · RBAC (แผน)", NAVY2],
];
function moduleSlide(part, from, to) {
  const sl = p.addSlide();
  sl.background = { color: WHITE };
  titleBlock(sl, `8 โมดูลหลัก · ส่วนที่ ${part}/2`, part === 1 ? "โครงสร้างระบบ (1–4)" : "โครงสร้างระบบ (5–8)", false);
  modules.slice(from, to).forEach((m, idx) => {
    const i = from + idx;
    const col = idx % 2, row = Math.floor(idx / 2);
    const x = 0.6 + col * 6.14;
    const y = 1.85 + row * 2.05;
    sl.addShape(p.ShapeType.roundRect, { x, y, w: 5.9, h: 1.85, rectRadius: 0.1, fill: { color: CARD }, line: { color: BORDER, width: 1 }, shadow: sh() });
    sl.addShape(p.ShapeType.roundRect, { x: x + 0.3, y: y + 0.32, w: 0.95, h: 0.95, rectRadius: 0.08, fill: { color: m[2] } });
    sl.addText(String(i + 1), { x: x + 0.3, y: y + 0.32, w: 0.95, h: 0.95, isTextBox: true, margin: 0, align: "center", valign: "middle", fontFace: F, fontSize: 30, bold: true, color: WHITE });
    sl.addText(m[0], { x: x + 1.45, y: y + 0.33, w: 4.25, h: 0.55, isTextBox: true, margin: 0, fontFace: F, fontSize: 18, bold: true, color: INK });
    sl.addText(m[1], { x: x + 1.45, y: y + 0.85, w: 4.3, h: 0.9, isTextBox: true, margin: 0, fontFace: F, fontSize: 12.5, color: MUTED });
  });
  return sl;
}
moduleSlide(1, 0, 4);
moduleSlide(2, 4, 8);

// ── 6. Workflow รายละเอียด ───────────────────────────────────────────────────
s = p.addSlide();
s.background = { color: WHITE };
titleBlock(s, "เส้นทางการทำงาน", "Workflow รีลีส 1 เพลง", false);
const steps = [
  ["Initiate", "เปิดโปรเจกต์ (Single/Album/Concert) เลือกสังกัด–ศิลปิน"],
  ["Workback Timeline", "ระบบคำนวณเดดไลน์ย้อนจากวันปล่อยอัตโนมัติ"],
  ["Production & Tasks", "สร้างงานตามเทมเพลต มอบหมายทีม ติดตามสถานะ"],
  ["Digital Assets", "ส่งไฟล์ → ตรวจ → เข้า Official Drive → สำรอง"],
  ["Finance", "คุมงบ CBS · ใช้จริง/เกิดจริง · ตรวจหลักฐาน"],
  ["Release", "ปล่อยเพลง พร้อมประวัติครบในระบบ"],
];
steps.forEach((st, i) => {
  const x = 0.6 + i * 2.04;
  s.addShape(p.ShapeType.roundRect, { x, y: 2.4, w: 1.86, h: 3.1, rectRadius: 0.1, fill: { color: i % 2 ? NAVY : CARD }, line: { color: BORDER, width: 1 }, shadow: sh() });
  s.addShape(p.ShapeType.ellipse, { x: x + 0.63, y: 2.65, w: 0.6, h: 0.6, fill: { color: AMBER } });
  s.addText(String(i + 1), { x: x + 0.63, y: 2.65, w: 0.6, h: 0.6, isTextBox: true, margin: 0, align: "center", valign: "middle", fontFace: F, fontSize: 20, bold: true, color: NAVY });
  s.addText(st[0], { x: x + 0.12, y: 3.4, w: 1.62, h: 0.65, isTextBox: true, margin: 0, align: "center", fontFace: F, fontSize: 14, bold: true, color: i % 2 ? WHITE : INK });
  s.addText(st[1], { x: x + 0.14, y: 4.05, w: 1.58, h: 1.35, isTextBox: true, margin: 0, align: "center", fontFace: F, fontSize: 11, color: i % 2 ? ICE : MUTED });
  if (i < steps.length - 1) s.addText("›", { x: x + 1.8, y: 2.4, w: 0.28, h: 3.1, isTextBox: true, margin: 0, align: "center", valign: "middle", fontFace: F, fontSize: 22, bold: true, color: AMBER });
});
s.addText("หัวใจคือ Workback Engine — เปลี่ยนวันปล่อยเมื่อไหร่ เดดไลน์ทุกงานขยับให้อัตโนมัติ", {
  x: 0.6, y: 5.95, w: 12.1, h: 0.5, isTextBox: true, margin: 0, fontFace: F, fontSize: 14, italic: true, bold: true, color: NAVY,
});

// ── 7. จุดเด่น ───────────────────────────────────────────────────────────────
s = p.addSlide();
s.background = { color: WHITE };
titleBlock(s, "จุดที่แตกต่าง", "สิ่งที่ทำให้ระบบนี้เหนือกว่าการทำมือ", false);
const highs = [
  ["Workback Engine", "คำนวณเดดไลน์ย้อนจากวันปล่อย — ทั้งโปรเจกต์ขยับตามอัตโนมัติ", AMBER],
  ["Maker–Checker Finance", "แยก งบ / ใช้จริง (Producer) / เกิดจริง (Account) ตรวจหลักฐานได้", EMERALD],
  ["Digital Asset Management", "ติดตามไฟล์ทั้ง Cloud และ Local พร้อมแคตตาล็อกทั้งค่าย", TEAL],
  ["Triage Dashboard", "เห็นงานเลยกำหนด/ด่วน ทั้งองค์กรในหน้าเดียว", VIOLET],
];
highs.forEach((h, i) => {
  const col = i % 2, row = Math.floor(i / 2);
  const x = 0.6 + col * 6.14;
  const y = 1.9 + row * 2.1;
  s.addShape(p.ShapeType.roundRect, { x, y, w: 5.9, h: 1.9, rectRadius: 0.1, fill: { color: WHITE }, line: { color: BORDER, width: 1.5 }, shadow: sh() });
  s.addShape(p.ShapeType.ellipse, { x: x + 0.3, y: y + 0.35, w: 0.8, h: 0.8, fill: { color: h[2] } });
  s.addText(String(i + 1), { x: x + 0.3, y: y + 0.35, w: 0.8, h: 0.8, isTextBox: true, margin: 0, align: "center", valign: "middle", fontFace: F, fontSize: 24, bold: true, color: WHITE });
  s.addText(h[0], { x: x + 1.3, y: y + 0.32, w: 4.4, h: 0.5, isTextBox: true, margin: 0, fontFace: F, fontSize: 17, bold: true, color: INK });
  s.addText(h[1], { x: x + 1.3, y: y + 0.82, w: 4.4, h: 0.95, isTextBox: true, margin: 0, fontFace: F, fontSize: 12.5, color: MUTED });
});

// ── 8. Finance chart ─────────────────────────────────────────────────────────
s = p.addSlide();
s.background = { color: WHITE };
titleBlock(s, "การเงิน · Maker vs Checker", "คุมงบประมาณ 3 ชั้น ต่อทุกเพลง", false);
const fsteps = [
  ["งบประมาณ (Budget)", "ตั้งไว้ตอนเริ่มโปรเจกต์ ตามโครงสร้างต้นทุน CBS", NAVY],
  ["ใช้จริง (Producer)", "โปรดิวเซอร์บันทึกยอดที่จ่ายจริงหลังทำงาน", AMBER],
  ["เกิดจริง (Account)", "บัญชียืนยันยอดสุทธิหลังตรวจหลักฐาน", EMERALD],
];
fsteps.forEach((fs, i) => {
  const y = 1.95 + i * 1.35;
  s.addShape(p.ShapeType.roundRect, { x: 0.6, y, w: 6.0, h: 1.15, rectRadius: 0.1, fill: { color: CARD }, line: { color: BORDER, width: 1 } });
  s.addShape(p.ShapeType.ellipse, { x: 0.85, y: y + 0.27, w: 0.6, h: 0.6, fill: { color: fs[2] } });
  s.addText(String(i + 1), { x: 0.85, y: y + 0.27, w: 0.6, h: 0.6, isTextBox: true, margin: 0, align: "center", valign: "middle", fontFace: F, fontSize: 20, bold: true, color: WHITE });
  s.addText(fs[0], { x: 1.6, y: y + 0.2, w: 4.8, h: 0.4, isTextBox: true, margin: 0, fontFace: F, fontSize: 15, bold: true, color: INK });
  s.addText(fs[1], { x: 1.6, y: y + 0.6, w: 4.8, h: 0.45, isTextBox: true, margin: 0, fontFace: F, fontSize: 11.5, color: MUTED });
});
s.addText("Variance = งบ − เกิดจริง  (เห็นทันทีว่าเกินงบหรือไม่)", {
  x: 0.6, y: 6.05, w: 6.0, h: 0.4, isTextBox: true, margin: 0, fontFace: F, fontSize: 12, italic: true, bold: true, color: NAVY,
});
const cats = ["AUDIO", "MV", "Key Visual", "Promo"];
const chartData = [
  { name: "งบ", labels: cats, values: [120, 260, 80, 90] },
  { name: "ใช้จริง", labels: cats, values: [110, 300, 75, 95] },
  { name: "เกิดจริง", labels: cats, values: [108, 285, 78, 92] },
];
s.addChart(p.ChartType.bar, chartData, {
  x: 7.0, y: 1.95, w: 5.7, h: 4.3, barDir: "col",
  chartColors: [NAVY2, AMBER, EMERALD],
  showTitle: true, title: "งบ vs ใช้จริง vs เกิดจริง (พันบาท)", titleFontFace: F, titleFontSize: 13, titleColor: INK,
  showLegend: true, legendPos: "b", legendFontFace: F, legendFontSize: 11, legendColor: MUTED,
  catAxisLabelColor: MUTED, catAxisLabelFontFace: F, catAxisLabelFontSize: 10,
  valAxisLabelColor: MUTED, valAxisLabelFontFace: F, valAxisLabelFontSize: 10,
  valGridLine: { color: BORDER, size: 1 }, catGridLine: { style: "none" },
  showValue: false,
});

// ── 9. Security ──────────────────────────────────────────────────────────────
s = p.addSlide();
s.background = { color: WHITE };
titleBlock(s, "ความปลอดภัย & การเข้าถึง", "ปลอดภัยระดับองค์กร พร้อมเข้าสู่ Portal", false);
const secs = [
  ["Google SSO เฉพาะองค์กร", "ล็อกอินด้วย Google ของบริษัทเท่านั้น — คนนอกเข้าไม่ได้", BLUE],
  ["Row-Level Security", "ฐานข้อมูลบังคับสิทธิ์ทุกแถว ต้องล็อกอินจึงเห็นข้อมูล", VIOLET],
  ["RBAC (แผนถัดไป)", "คุมสิทธิ์รายแผนก เช่น การเงินเห็นเฉพาะทีมการเงิน", EMERALD],
  ["พร้อมผูกกับ Portal", "ใช้ Google เดียวกัน → เข้าใช้งานต่อเนื่องไม่ต้องล็อกอินซ้ำ", AMBER],
];
secs.forEach((it, i) => {
  const col = i % 2, row = Math.floor(i / 2);
  const x = 0.6 + col * 6.14, y = 1.9 + row * 2.1;
  s.addShape(p.ShapeType.roundRect, { x, y, w: 5.9, h: 1.9, rectRadius: 0.1, fill: { color: CARD }, line: { color: BORDER, width: 1 }, shadow: sh() });
  s.addShape(p.ShapeType.ellipse, { x: x + 0.3, y: y + 0.55, w: 0.55, h: 0.55, fill: { color: it[2] } });
  s.addText(it[0], { x: x + 1.05, y: y + 0.32, w: 4.6, h: 0.5, isTextBox: true, margin: 0, fontFace: F, fontSize: 16, bold: true, color: INK });
  s.addText(it[1], { x: x + 1.05, y: y + 0.82, w: 4.6, h: 0.95, isTextBox: true, margin: 0, fontFace: F, fontSize: 12.5, color: MUTED });
});

// ── 10. สถานะปัจจุบัน ─────────────────────────────────────────────────────────
s = p.addSlide();
s.background = { color: WHITE };
titleBlock(s, "สถานะ ณ ปัจจุบัน", "ใช้งานได้จริงแล้วบน Production", false);
const live = ["Command Center", "Release Management", "Collaboration + Comments", "Digital Assets (DAM)", "Finance (Budget/Actual/Verified)", "Internal / Ad-Hoc Work", "Team & Templates", "Google SSO + RLS"];
live.forEach((t, i) => {
  const col = i % 2, row = Math.floor(i / 2);
  const x = 0.6 + col * 6.14, y = 1.85 + row * 0.95;
  s.addShape(p.ShapeType.roundRect, { x, y, w: 5.9, h: 0.78, rectRadius: 0.08, fill: { color: CARD }, line: { color: BORDER, width: 1 } });
  s.addShape(p.ShapeType.ellipse, { x: x + 0.22, y: y + 0.19, w: 0.4, h: 0.4, fill: { color: EMERALD } });
  s.addText(String.fromCharCode(0x2713), { x: x + 0.22, y: y + 0.19, w: 0.4, h: 0.4, isTextBox: true, margin: 0, align: "center", valign: "middle", fontFace: F, fontSize: 15, bold: true, color: WHITE });
  s.addText(t, { x: x + 0.8, y, w: 4.95, h: 0.78, isTextBox: true, margin: 0, valign: "middle", fontFace: F, fontSize: 14, bold: true, color: INK });
});
s.addText("ครบทั้ง 8 โมดูลหลัก — รันบนระบบจริง ปลอดภัย และต่อยอดได้", {
  x: 0.6, y: 6.3, w: 12.1, h: 0.4, isTextBox: true, margin: 0, fontFace: F, fontSize: 14, italic: true, bold: true, color: NAVY,
});

// ── 11. Roadmap ─────────────────────────────────────────────────────────────
s = p.addSlide();
s.background = { color: WHITE };
titleBlock(s, "ก้าวต่อไป", "Roadmap & การเข้าสู่ Portal องค์กร", false);
const road = [
  ["ระยะสั้น", "RBAC คุมสิทธิ์รายแผนก · หน้าจัดการสังกัด/ศิลปิน", BLUE],
  ["ระยะกลาง", "ผูกเข้า Portal องค์กรผ่าน Google SSO (เมนูเดียว ล็อกอินครั้งเดียว)", AMBER],
  ["ระยะยาว", "รายงาน/วิเคราะห์ต้นทุน–รายได้ · ปรับโครงสร้างเป็นโมดูลแยกชัด", EMERALD],
];
road.forEach((r, i) => {
  const x = 0.6 + i * 4.09;
  s.addShape(p.ShapeType.roundRect, { x, y: 2.1, w: 3.85, h: 3.4, rectRadius: 0.12, fill: { color: i === 1 ? NAVY : CARD }, line: { color: BORDER, width: 1 }, shadow: sh() });
  s.addShape(p.ShapeType.roundRect, { x: x + 0.3, y: 2.4, w: 1.6, h: 0.55, rectRadius: 0.1, fill: { color: r[2] } });
  s.addText(r[0], { x: x + 0.3, y: 2.4, w: 1.6, h: 0.55, isTextBox: true, margin: 0, align: "center", valign: "middle", fontFace: F, fontSize: 13, bold: true, color: i === 1 ? NAVY : WHITE });
  s.addText(r[1], { x: x + 0.3, y: 3.2, w: 3.25, h: 2.1, isTextBox: true, margin: 0, fontFace: F, fontSize: 14, color: i === 1 ? ICE : INK });
});
s.addText("เป้าหมาย: เป็นระบบกลางงานปล่อยเพลงของทั้งองค์กร เข้าถึงจาก Portal ได้ทันที", {
  x: 0.6, y: 5.95, w: 12.1, h: 0.4, isTextBox: true, margin: 0, fontFace: F, fontSize: 14, italic: true, bold: true, color: NAVY,
});

// ── 12. Closing (dark) ──────────────────────────────────────────────────────
s = p.addSlide();
s.background = { color: NAVY };
s.addShape(p.ShapeType.ellipse, { x: -2.1, y: 4.3, w: 5.4, h: 5.4, fill: { color: NAVY2 } });
s.addText("พร้อมใช้งานจริงแล้ว", { x: 0.9, y: 2.5, w: 11.5, h: 0.9, isTextBox: true, margin: 0, fontFace: F, fontSize: 40, bold: true, color: WHITE });
s.addText("Label Operations System — ระบบภายในของบริษัท ครึ่งเก้า สำหรับบริหารงานปล่อยเพลงทั้งกระบวนการ", {
  x: 0.9, y: 3.55, w: 10.8, h: 0.8, isTextBox: true, margin: 0, fontFace: F, fontSize: 16, color: ICE,
});
s.addShape(p.ShapeType.line, { x: 0.95, y: 4.5, w: 2.2, h: 0, line: { color: AMBER, width: 2.5 } });
s.addText("จัดทำโดยทีมพัฒนาภายใน · บริษัท ครึ่งเก้า", { x: 0.9, y: 6.5, w: 11, h: 0.35, isTextBox: true, margin: 0, fontFace: F, fontSize: 12, color: "8893B8" });
s.addNotes("ปิดท้าย: ระบบพร้อมใช้งานจริง และพร้อมต่อยอดเข้าสู่ Portal องค์กร");

p.writeFile({ fileName: "C:/Users/johnt/AppData/Local/Temp/claude/C--Users-johnt-Kruengkao/24d3d121-bf3b-4d14-b824-54daf8ffbb34/scratchpad/Kruengkao-Label-Ops-Overview.pptx" })
  .then((f) => console.log("WROTE", f))
  .catch((e) => { console.error(e); process.exit(1); });
