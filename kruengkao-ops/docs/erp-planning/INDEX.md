# ครึ่งเก้า — ERP Planning (ชุดเอกสาร/ดีไซน์)

เก็บไว้ **นอก git repo** โดยตั้งใจ (ยังไม่ commit — รอผลประชุมก่อน)
ที่อยู่: `C:\Users\johnt\Kruengkao-ERP-Planning\`
อัปเดตล่าสุด: 2026-10-06

---

## สิ่งที่อยู่ในโฟลเดอร์นี้

| โฟลเดอร์ | ไฟล์ | คืออะไร |
|---|---|---|
| `spec/` | `erp-data-model-spec.md` | สเปคส่งมอบ dev ERP — data model, ERD, enum, validation, ตัวอย่างจริง, ร่าง SQL (รวม multi-pool royalty + rights layer + recoup) |
| `diagram/` | `erp-diagram.html` | ซอร์สของแผนภาพ (revenue flow 2 ชั้น + ERD + pool concept) |
| `decks/` | `Kruengkao-ERP-Roadmap.pptx` | **เด็คหลัก** As-is → To-be · Roadmap (13 สไลด์) — มี block diagram ปัจจุบัน/อนาคต |
| `decks/` | `Kruengkao-Label-Ops-Overview.pptx` | เด็คภาพรวมระบบตัวแรก (12 สไลด์) |
| `_source/` | `build_deck.js`, `build_roadmap.js` | สคริปต์ pptxgenjs สร้างเด็ค (แก้แล้ว rebuild ได้) |

## แผนภาพสด (Artifact)
- **ERP Data Model (แผนภาพคุยกับทีม):** https://claude.ai/artifact/LKig2jZ5okmwjGnNirK1Cs
  (ส่วนตัว — ต้องกด Share ในหน้าก่อนทีมถึงเปิดได้)

---

## วิธี rebuild เด็ค (ถ้าจะแก้)
```bash
cd <โฟลเดอร์ที่มี build_roadmap.js>
npm install pptxgenjs        # ครั้งแรกครั้งเดียว
node build_roadmap.js        # จะได้ .pptx ออกมา
```
> เด็คใช้ฟอนต์ **Tahoma** (รองรับไทยดีบน PowerPoint/Google Slides) · แก้เนื้อหาในอาร์เรย์บนสุดของสคริปต์

---

## สถานะ decision (รอเคาะหลังประชุม)

**โครงเด็ค As-is → To-be** — ทีมเห็นชอบหรือไม่ · เรียง 6 โดเมน (รากฐาน · Catalog · Workflow · Distribution · Finance · Royalty) + Platform + Roadmap 3 เฟส

**การจัดเฟส (ปรับ 2026-10-07):**
- **Phase 1 = ครบลูป "รับข้อมูล → ทำจ่าย"** — Artist/People + สิทธิ์ + multi-pool royalty + บันทึกรายได้ + royalty engine + recoup + statement + ใบเปิด/ปิด + จ่าย+WHT + RBAC
- **Phase 2 = รายละเอียด task · deliverables · distribution** (checklist, metadata form, ISRC/UPC, e-sign, Portal)
- **Phase 3 = ขยายผล + วิเคราะห์** (DSP auto, BI, Artist Portal, API, automation, audit)
- ป้ายสถานะในเด็คเปลี่ยนเป็น **มี / P1 / P2 / P3**

**โมเดล Royalty (เคาะแล้วบางส่วน):**
- ✅ multi-pool, แต่ละ pool = 100% (จำนวนไม่จำกัด)
- ✅ แบบรวม = Σ(น้ำหนัก × ส่วนแบ่ง) — ใช้ไปก่อน
- ⏳ ส่วนค่าย → business model (Mastered Rights 70/30·80/20 · Musical Rights 50/50) — ยังไม่ลงรายละเอียด
- ⏳ recoup — กำหนดภายหลัง

**ยังไม่ได้ทำ (รอตัดสินใจ):**
- commit ชุดนี้เข้า repo (เช่น branch `docs/erp-spec`)
- ส่วนของค่าย / recoup / WHT รายละเอียด
- เลือกฟีเจอร์เข้า deck รอบ present จริง

---

## งานค้างอื่น (ไม่เกี่ยวกับ ERP planning โดยตรง)
- **staging Supabase (`iqnwhopnahvdrxwmdxux`) ถูก Pause** → ต้อง Restore ก่อนทดสอบแอป (local/preview ชี้ staging)
- branch ที่ยังไม่ merge: `refactor/dynamic-labels-artists`, `refactor/module-routes` (มี Finance module)
- prod ต้องรัน migration `0012`–`0015` เมื่อจะ merge งานล่าสุด
