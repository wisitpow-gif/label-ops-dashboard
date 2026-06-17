// Master data: Label → Artist roster.
// Drives the dependent Label/Artist dropdowns in the project forms so a
// promoter can only pick an artist that belongs to the chosen label.

export const LABEL_ARTISTS_DATA: Record<string, string[]> = {
  BRIDGE: [
    "ADORA",
    "ASIA7",
    "AYEJAY",
    "AYLA's",
    "dena euprasert",
    "Famoso",
    "fit aroon",
    "FLURE",
    "Hard Boy",
    "INDIGO",
    "Jigsaw Story",
    "miller",
    "NINEOKMAI",
    "ossey",
    "Par-T",
    "QEETHA",
    "The Darkest Romance",
    "Three Man Down",
    "Tilly Birds",
  ],
  MACHg: [
    "ก้อง ห้วยไร่",
    "ใหม่ พัชรี",
    "กอกี้ กวิสรา",
    "ปราง ปรางทิพย์",
    "หนุ่ม ปริญวัฒน์",
    "วิว วัลนิกา",
    "ชาชม เสาวคนธ์",
  ],
  "9Arkkhan": ["TaitosmitH"],
};

// Canonical label list (order preserved from the master data).
export const LABELS = Object.keys(LABEL_ARTISTS_DATA);

/** Artists belonging to a label ([] if the label is unknown/unset). */
export function artistsForLabel(label: string): string[] {
  return LABEL_ARTISTS_DATA[label] ?? [];
}
