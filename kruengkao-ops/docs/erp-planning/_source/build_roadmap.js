const pptxgen = require("pptxgenjs");
const p = new pptxgen();
p.layout = "LAYOUT_WIDE";
p.author = "บริษัท ครึ่งเก้า";
p.company = "บริษัท ครึ่งเก้า";

const NAVY="161A3B", NAVY2="28315F", AMBER="F2B705", ICE="CFD8F5", WHITE="FFFFFF",
  CARD="F5F7FB", BORDER="E3E7F2", INK="1A1D2B", MUTED="5B6176",
  EMERALD="1FA97A", VIOLET="6D5AE0", TEAL="128E7C", BLUE="2E6BE6", SUB="8893B8";
const F="Tahoma";
const sh=()=>({type:"outer",color:"9AA3C0",blur:8,offset:3,angle:90,opacity:0.22});

// status pill
const TAG={ "มี":EMERALD, "P1":AMBER, "P2":BLUE, "P3":VIOLET };

function titleBlock(s,kicker,title){
  s.addText(kicker,{x:0.6,y:0.42,w:12.1,h:0.3,isTextBox:true,margin:0,fontFace:F,fontSize:12,bold:true,charSpacing:2,color:AMBER});
  s.addText(title,{x:0.6,y:0.72,w:12.1,h:0.7,isTextBox:true,margin:0,fontFace:F,fontSize:28,bold:true,color:INK});
}

// ── 1. Cover ────────────────────────────────────────────────────────────────
let s=p.addSlide(); s.background={color:NAVY};
s.addShape(p.ShapeType.ellipse,{x:10.1,y:-2.3,w:5.8,h:5.8,fill:{color:NAVY2}});
s.addShape(p.ShapeType.ellipse,{x:11.8,y:4.8,w:4.0,h:4.0,fill:{color:"1F264B"}});
s.addText("บริษัท ครึ่งเก้า · STRATEGY",{x:0.85,y:1.6,w:11,h:0.4,isTextBox:true,margin:0,fontFace:F,fontSize:13,bold:true,charSpacing:3,color:AMBER});
s.addText("Label Operations",{x:0.8,y:2.05,w:11.6,h:0.95,isTextBox:true,margin:0,fontFace:F,fontSize:46,bold:true,color:WHITE});
s.addText("As-is → To-be · Product Roadmap",{x:0.85,y:3.05,w:11.6,h:0.7,isTextBox:true,margin:0,fontFace:F,fontSize:24,bold:true,color:ICE});
s.addShape(p.ShapeType.line,{x:0.9,y:4.0,w:2.2,h:0,line:{color:AMBER,width:2.5}});
s.addText("สิ่งที่มีในมือวันนี้ และทิศทางที่จะเติบโตเป็นเฟส",{x:0.85,y:4.2,w:10.8,h:0.5,isTextBox:true,margin:0,fontFace:F,fontSize:15,color:ICE});
s.addText("ภาพรวมระบบสำหรับนำเสนอภายในองค์กร",{x:0.85,y:6.55,w:11,h:0.35,isTextBox:true,margin:0,fontFace:F,fontSize:12,color:SUB});

// ── 2. Vision / lifecycle spine ─────────────────────────────────────────────
s=p.addSlide(); s.background={color:WHITE};
titleBlock(s,"วิสัยทัศน์","ระบบเดียวครอบวงจรชีวิตของเพลง");
s.addText("จากเซ็นสัญญา–ถือสิทธิ์ ไปจนถึงปล่อยเพลง เก็บเงิน และแบ่งส่วนแบ่ง — ทุกขั้นอยู่ในระบบเดียว",
  {x:0.6,y:1.7,w:12,h:0.6,isTextBox:true,margin:0,fontFace:F,fontSize:16,color:MUTED});
const spine=[["รากฐาน","สัญญา·สิทธิ์·ศิลปิน",VIOLET],["Catalog","ทะเบียน·ISRC·Library",TEAL],
  ["Workflow","โปรเจกต์·งาน·ทีม",BLUE],["Distribution","Metadata·ปล่อยเพลง",AMBER],
  ["Finance","งบ·จ่าย·ต้นทุน",EMERALD],["Royalty & Report","ส่วนแบ่ง·วิเคราะห์",NAVY2]];
spine.forEach((it,i)=>{
  const x=0.6+i*2.08;
  s.addShape(p.ShapeType.roundRect,{x,y:3.1,w:1.9,h:1.9,rectRadius:0.1,fill:{color:CARD},line:{color:BORDER,width:1},shadow:sh()});
  s.addShape(p.ShapeType.ellipse,{x:x+0.68,y:3.35,w:0.55,h:0.55,fill:{color:it[2]}});
  s.addText(String(i+1),{x:x+0.68,y:3.35,w:0.55,h:0.55,isTextBox:true,margin:0,align:"center",valign:"middle",fontFace:F,fontSize:18,bold:true,color:WHITE});
  s.addText(it[0],{x:x+0.1,y:4.0,w:1.7,h:0.45,isTextBox:true,margin:0,align:"center",fontFace:F,fontSize:13.5,bold:true,color:INK});
  s.addText(it[1],{x:x+0.08,y:4.42,w:1.74,h:0.5,isTextBox:true,margin:0,align:"center",fontFace:F,fontSize:9.5,color:MUTED});
  if(i<spine.length-1) s.addText("›",{x:x+1.86,y:3.1,w:0.26,h:1.9,isTextBox:true,margin:0,align:"center",valign:"middle",fontFace:F,fontSize:20,bold:true,color:AMBER});
});
s.addText("โครงนำเสนอ: ① สิ่งที่มีแล้ว (As-is)  →  ② ส่วนขยายที่จำเป็น (To-be) เรียงตามวงจร  →  ③ Roadmap เป็นเฟส",
  {x:0.6,y:5.7,w:12.1,h:0.5,isTextBox:true,margin:0,fontFace:F,fontSize:13,italic:true,bold:true,color:NAVY});

// ── 3 & 4. Module block map (As-is / To-be) ─────────────────────────────────
const DOMAINS=[["รากฐาน",VIOLET],["Catalog",TEAL],["Workflow",BLUE],["Distribution",AMBER],["Finance",EMERALD],["Royalty",NAVY2]];
const GRID=[
  [["Team Members","ทีมงาน","มี"],["Artist / People","ข้อมูลศิลปิน","ใหม่"],["Contracts & Rights","สัญญา·สิทธิ์·ส่วนแบ่ง","ใหม่"]],
  [["Digital Library","คลังไฟล์","มี"],["Library Map","แคตตาล็อก","มี"],["Catalog + ISRC","ทะเบียน·รหัส","ใหม่"]],
  [["Dashboard","Triage งานด่วน","มี"],["Project Workflow","timeline · tasks","มี"],["Gantt · Calendar","Workload","มี"]],
  [["Metadata Form","กรอกเข้าระบบ","ใหม่"],["Deliverables","checklist ไฟล์","ใหม่"],["DSP Delivery","ส่งจัดจำหน่าย","อนาคต"]],
  [["Budget / Actual","CBS Maker-Checker","มี"],["ใบเปิด / ใบปิด","ปิดงบ · ล็อก","ใหม่"],["Payments / WHT","จ่าย · หักภาษี","อนาคต"]],
  [["Royalty Pools","ตั้งส่วนแบ่ง","ใหม่"],["Royalty Engine","คิด · statement","อนาคต"],["BI / Analytics","วิเคราะห์","อนาคต"]],
];
const PLAT=[["SSO","Single Sign-On","มี"],["RBAC","Role-Based Access Control","ใหม่"],["Portal","เชื่อมองค์กร","กำลังทำ"],["Audit","ประวัติ·สำรอง","อนาคต"]];

function block(sl,x,y,w,h,m,mode){
  const have=m[2]==="มี";
  let fill,line,c1,c2;
  if(have){ fill=EMERALD; line=EMERALD; c1=WHITE; c2="DFF5EC"; }
  else if(mode==="asis"){ fill=WHITE; line=MUTED; c1=MUTED; c2=MUTED; }
  else { fill=AMBER; line="C99400"; c1=INK; c2="5A4A10"; }
  const opt={x,y,w,h,rectRadius:0.07,fill:{color:fill},line:{color:line,width:1.2}};
  if(!have&&mode==="asis") opt.line.dashType="dash";
  sl.addShape(p.ShapeType.roundRect,opt);
  sl.addText(m[0],{x:x+0.08,y:y+0.07,w:w-0.16,h:0.3,isTextBox:true,margin:0,align:"center",fontFace:F,fontSize:10.5,bold:true,color:c1});
  const sub=(!have&&mode==="asis")?"ยังไม่มี":m[1];
  sl.addText(sub,{x:x+0.08,y:y+0.36,w:w-0.16,h:0.24,isTextBox:true,margin:0,align:"center",fontFace:F,fontSize:8.5,color:c2});
}

function moduleMap(mode){
  const sl=p.addSlide(); sl.background={color:WHITE};
  titleBlock(sl, mode==="asis"?"ปัจจุบัน · ตอนนี้มีอะไร":"อนาคต · จะเพิ่มอะไร",
    mode==="asis"?"โมดูลที่ใช้งานได้จริงแล้ววันนี้":"เติมโมดูลที่เหลือให้ครบทั้งวงจร");
  // domain headers
  DOMAINS.forEach((d,i)=>{ const x=0.45+i*2.07;
    sl.addShape(p.ShapeType.roundRect,{x,y:1.68,w:1.92,h:0.36,rectRadius:0.08,fill:{color:d[1]}});
    sl.addText(d[0],{x,y:1.68,w:1.92,h:0.36,isTextBox:true,margin:0,align:"center",valign:"middle",fontFace:F,fontSize:11,bold:true,color:WHITE});
  });
  // module blocks
  GRID.forEach((col,i)=>{ const x=0.45+i*2.07;
    col.forEach((m,j)=>{ block(sl,x,2.2+j*0.78,1.92,0.64,m,mode); });
  });
  // platform band
  sl.addShape(p.ShapeType.roundRect,{x:0.45,y:5.5,w:11.99,h:1.0,rectRadius:0.1,fill:{color:CARD},line:{color:BORDER,width:1}});
  sl.addText("Platform",{x:0.65,y:5.7,w:1.9,h:0.3,isTextBox:true,margin:0,fontFace:F,fontSize:13,bold:true,color:INK});
  sl.addText("รองรับทุกโดเมน",{x:0.65,y:6.0,w:1.9,h:0.3,isTextBox:true,margin:0,fontFace:F,fontSize:10,color:MUTED});
  PLAT.forEach((m,i)=>{ block(sl,2.75+i*2.4,5.66,2.25,0.68,m,mode); });
  // legend
  const lg = mode==="asis"
    ? "เขียว = มีแล้ว   ·   เส้นประ = ยังไม่มี (จะเพิ่มในอนาคต)"
    : "เขียว = มีแล้ว   ·   เหลือง = เพิ่มในอนาคต";
  sl.addText(lg,{x:0.45,y:6.62,w:12,h:0.3,isTextBox:true,margin:0,align:"center",fontFace:F,fontSize:11,italic:true,color:MUTED});
}
moduleMap("asis");
moduleMap("tobe");

// ── To-be domain slide helper ───────────────────────────────────────────────
function domain(num,kicker,title,subtitle,accent,items){
  const sl=p.addSlide(); sl.background={color:WHITE};
  sl.addText(kicker,{x:0.6,y:0.42,w:12.1,h:0.3,isTextBox:true,margin:0,fontFace:F,fontSize:12,bold:true,charSpacing:2,color:AMBER});
  sl.addShape(p.ShapeType.roundRect,{x:0.6,y:0.78,w:0.7,h:0.7,rectRadius:0.08,fill:{color:accent}});
  sl.addText(String(num),{x:0.6,y:0.78,w:0.7,h:0.7,isTextBox:true,margin:0,align:"center",valign:"middle",fontFace:F,fontSize:26,bold:true,color:WHITE});
  sl.addText(title,{x:1.45,y:0.76,w:11.2,h:0.5,isTextBox:true,margin:0,fontFace:F,fontSize:26,bold:true,color:INK});
  sl.addText(subtitle,{x:1.45,y:1.3,w:11.2,h:0.4,isTextBox:true,margin:0,fontFace:F,fontSize:14,color:MUTED});
  items.forEach((it,i)=>{
    const col=i%2,row=Math.floor(i/2);
    const x=0.6+col*6.14,y=2.05+row*1.5;
    sl.addShape(p.ShapeType.roundRect,{x,y,w:5.9,h:1.3,rectRadius:0.1,fill:{color:CARD},line:{color:BORDER,width:1},shadow:sh()});
    // status pill
    const pc=TAG[it[2]];
    sl.addShape(p.ShapeType.roundRect,{x:x+0.3,y:y+0.28,w:0.95,h:0.42,rectRadius:0.2,fill:{color:pc}});
    sl.addText(it[2],{x:x+0.3,y:y+0.28,w:0.95,h:0.42,isTextBox:true,margin:0,align:"center",valign:"middle",fontFace:F,fontSize:11,bold:true,color:WHITE});
    sl.addText(it[0],{x:x+1.4,y:y+0.22,w:4.3,h:0.5,isTextBox:true,margin:0,fontFace:F,fontSize:15.5,bold:true,color:INK});
    sl.addText(it[1],{x:x+0.3,y:y+0.78,w:5.3,h:0.45,isTextBox:true,margin:0,fontFace:F,fontSize:11.5,color:MUTED});
  });
  return sl;
}

// 4
domain(1,"TO-BE · วงจรที่ 1","รากฐาน: สัญญา · สิทธิ์ · ศิลปิน · ส่วนแบ่ง",
  "ตั้งต้นให้ถูกตั้งแต่ใครถือสิทธิ์และแบ่งกันยังไง",VIOLET,[
  ["ข้อมูลศิลปิน/ผู้ร่วมงาน (master)","Person/Artist เก็บบัญชี·ภาษี reuse ข้ามเพลง","P1"],
  ["การถือสิทธิ์ (Master / Musical)","ตั้งสัดส่วนค่าย↔ศิลปิน (70/30·80/20 · 50/50)","P1"],
  ["โมเดลส่วนแบ่ง multi-pool","หลายหัวข้อ · แต่ละ pool รวม 100%","P1"],
  ["สัญญา + ลายเซ็นดิจิทัล","ช่วงเวลา·เงื่อนไขสิทธิ์ + e-signature","P2"],
]);
// 5
domain(2,"TO-BE · วงจรที่ 2","Catalog & Library",
  "ทะเบียนผลงานกลาง เชื่อม ISRC/UPC และคลังไฟล์",TEAL,[
  ["Digital Library (DAM)","ติดตามไฟล์ Cloud + Local","มี"],
  ["Library Map","ค้นหาแคตตาล็อกทั้งค่าย","มี"],
  ["ทะเบียนเพลง/อัลบั้ม/เวอร์ชัน","Catalog กลางของทุกผลงาน","P2"],
  ["ISRC / UPC management","ออก·ผูกรหัสจัดจำหน่าย","P2"],
]);
// 6
domain(3,"TO-BE · วงจรที่ 3","Workflow & Dashboard",
  "เปิดโปรเจกต์ต่อเพลง และคุมงานทั้งทีม (As-is แข็งสุด)",BLUE,[
  ["เปิดโปรเจกต์ต่อเพลง","Wizard + copy เทมเพลตงาน/งบอัตโนมัติ","มี"],
  ["Workback Timeline engine","คำนวณเดดไลน์ย้อนจากวันปล่อย","มี"],
  ["Tasks · dependency · thread","มอบหมาย·กั้นงาน·คุยในงาน","มี"],
  ["Dashboard · Gantt · Workload","Triage งานด่วนทั้งองค์กร","มี"],
]);
// 7
domain(4,"TO-BE · วงจรที่ 4","Distribution & Metadata",
  "เลิกส่ง Excel — กรอกฟอร์มเข้าระบบทั้งหมด",AMBER,[
  ["ฟอร์ม Metadata ในระบบ","แทนชีต To Distributor เดิม","P2"],
  ["Deliverable checklist","เช็กไฟล์ส่งมอบครบต่อเพลง","P2"],
  ["เครดิต 2 ภาษา · TikTok · URLs","ครบตามที่ distributor ต้องการ","P2"],
  ["ส่งต่อ DSP / Distributor","ส่ง metadata+asset อัตโนมัติ","P3"],
]);
// 8
domain(5,"TO-BE · วงจรที่ 5","Finance",
  "คุมงบ ต้นทุน และการจ่ายเงินทั้งวงจร",EMERALD,[
  ["CBS Budget / ใช้จริง / เกิดจริง","Maker-Checker + แนบหลักฐาน","มี"],
  ["ใบเปิด / ใบปิดงบ","เปิด→ปิด + ล็อกแก้หลังปิด","P1"],
  ["จ่ายเงิน + หัก ณ ที่จ่าย (WHT)","payment run + หนังสือรับรอง","P1"],
  ["P&L ต่อเพลง / ศิลปิน","ต้นทุน vs รายได้ vs recoup","P3"],
]);
// 9
domain(6,"TO-BE · วงจรที่ 6","Royalty & Reporting",
  "ปิดวงจร: บันทึกรายได้ → คิดส่วนแบ่ง → ทำจ่าย",NAVY2,[
  ["บันทึกรายได้เข้าระบบ","เริ่ม manual → นำเข้าอัตโนมัติภายหลัง","P1"],
  ["Royalty engine + recoup","คิดส่วนแบ่งต่อรอบ หักทุนก่อน","P1"],
  ["Statement ส่วนแบ่งต่อคน","ออกใบแจ้ง/ดาวน์โหลด (PDF)","P1"],
  ["Dashboard & Analytics","รายได้·ต้นทุน·กำไร ต่อเพลง/ศิลปิน","P3"],
]);

// ── 10. Platform (cross-cutting) ────────────────────────────────────────────
s=p.addSlide(); s.background={color:WHITE};
titleBlock(s,"ชั้นรองรับทุกโดเมน","Platform · ความปลอดภัย · การเข้าถึง");
const plat=[
  ["SSO · Single Sign-On","ล็อกอิน Google ครั้งเดียว เฉพาะองค์กร","มี",EMERALD],
  ["RBAC · Role-Based Access Control","คุมสิทธิ์รายโมดูล (Finance เฉพาะทีมการเงิน)","P1",AMBER],
  ["เชื่อมเข้า Portal องค์กร","ส่งลิงก์ต่อโมดูล · SSO ต่อเนื่อง","P2",BLUE],
  ["Audit log + Backup","ใครแก้อะไรเมื่อไหร่ · สำรองข้อมูล","P3",VIOLET],
];
plat.forEach((it,i)=>{
  const col=i%2,row=Math.floor(i/2);
  const x=0.6+col*6.14,y=1.9+row*2.05;
  s.addShape(p.ShapeType.roundRect,{x,y,w:5.9,h:1.85,rectRadius:0.1,fill:{color:CARD},line:{color:BORDER,width:1},shadow:sh()});
  s.addShape(p.ShapeType.ellipse,{x:x+0.3,y:y+0.55,w:0.75,h:0.75,fill:{color:it[3]}});
  s.addText(String(i+1),{x:x+0.3,y:y+0.55,w:0.75,h:0.75,isTextBox:true,margin:0,align:"center",valign:"middle",fontFace:F,fontSize:24,bold:true,color:WHITE});
  s.addText(it[0],{x:x+1.25,y:y+0.3,w:4.4,h:0.5,isTextBox:true,margin:0,fontFace:F,fontSize:16.5,bold:true,color:INK});
  s.addText(it[1],{x:x+1.25,y:y+0.8,w:4.4,h:0.6,isTextBox:true,margin:0,fontFace:F,fontSize:12,color:MUTED});
  const pc=TAG[it[2]];
  s.addShape(p.ShapeType.roundRect,{x:x+1.25,y:y+1.3,w:0.95,h:0.36,rectRadius:0.18,fill:{color:pc}});
  s.addText(it[2],{x:x+1.25,y:y+1.3,w:0.95,h:0.36,isTextBox:true,margin:0,align:"center",valign:"middle",fontFace:F,fontSize:10.5,bold:true,color:WHITE});
});

// ── 11. Roadmap ─────────────────────────────────────────────────────────────
s=p.addSlide(); s.background={color:WHITE};
titleBlock(s,"แผนการเติบโต","Roadmap — 3 เฟส");
const phases=[
  ["Phase 1 · Now","ครบลูป: รับข้อมูล → ทำจ่าย",EMERALD,
    ["ฐานเดิม: Dashboard·Workflow·DAM·CBS·SSO","Artist/People master + การถือสิทธิ์","โมเดลส่วนแบ่ง multi-pool","บันทึกรายได้ + Royalty engine + recoup","Statement ส่วนแบ่ง + ใบเปิด/ปิดงบ","จ่ายเงิน + WHT + RBAC"]],
  ["Phase 2 · Next","รายละเอียด task · deliverables · distribution",AMBER,
    ["Deliverable checklist ต่อเพลง","Metadata form เต็ม (เลิก Excel)","เครดิต 2 ภาษา · TikTok · URLs","ISRC/UPC management","สัญญา + e-signature","Portal integration"]],
  ["Phase 3 · Later","ขยายผล + วิเคราะห์",VIOLET,
    ["ส่งต่อ DSP + นำเข้ารายได้อัตโนมัติ","BI / Analytics (กำไรต่อเพลง)","Artist Portal","API / Integrations","Automation / AI","Audit log"]],
];
phases.forEach((ph,i)=>{
  const x=0.6+i*4.09;
  s.addShape(p.ShapeType.roundRect,{x,y:1.9,w:3.85,h:4.9,rectRadius:0.12,fill:{color:CARD},line:{color:BORDER,width:1},shadow:sh()});
  s.addShape(p.ShapeType.roundRect,{x,y:1.9,w:3.85,h:0.95,rectRadius:0.12,fill:{color:ph[2]}});
  s.addShape(p.ShapeType.rect,{x,y:2.5,w:3.85,h:0.35,fill:{color:ph[2]}});
  s.addText(ph[0],{x:x+0.25,y:2.0,w:3.4,h:0.4,isTextBox:true,margin:0,fontFace:F,fontSize:16,bold:true,color:WHITE});
  s.addText(ph[1],{x:x+0.25,y:2.42,w:3.4,h:0.35,isTextBox:true,margin:0,fontFace:F,fontSize:11,color:"F3F5FF"});
  const bullets=ph[3].map((t,j)=>({text:t,options:{bullet:{code:"2022"},color:INK,fontSize:12.5,fontFace:F,paraSpaceAfter:8,breakLine:true}}));
  s.addText(bullets,{x:x+0.3,y:3.05,w:3.3,h:3.5,isTextBox:true,margin:0,valign:"top"});
});

// ── 12. Close ───────────────────────────────────────────────────────────────
s=p.addSlide(); s.background={color:NAVY};
s.addShape(p.ShapeType.ellipse,{x:-2.1,y:4.3,w:5.4,h:5.4,fill:{color:NAVY2}});
s.addText("จากของจริงวันนี้ สู่ระบบครบวงจร",{x:0.9,y:2.4,w:11.5,h:0.9,isTextBox:true,margin:0,fontFace:F,fontSize:34,bold:true,color:WHITE});
s.addText("ฐานพร้อมแล้ว · ส่วนขยายชัดเจน · เติบโตเป็นเฟสได้ทันที",{x:0.9,y:3.5,w:10.8,h:0.6,isTextBox:true,margin:0,fontFace:F,fontSize:16,color:ICE});
s.addShape(p.ShapeType.line,{x:0.95,y:4.4,w:2.2,h:0,line:{color:AMBER,width:2.5}});
s.addText("บริษัท ครึ่งเก้า · ทีมพัฒนาภายใน",{x:0.9,y:6.5,w:11,h:0.35,isTextBox:true,margin:0,fontFace:F,fontSize:12,color:SUB});

p.writeFile({fileName:"C:/Users/johnt/AppData/Local/Temp/claude/C--Users-johnt-Kruengkao/24d3d121-bf3b-4d14-b824-54daf8ffbb34/scratchpad/Kruengkao-ERP-Roadmap.pptx"})
  .then(f=>console.log("WROTE",f)).catch(e=>{console.error(e);process.exit(1);});
