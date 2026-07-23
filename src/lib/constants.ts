export const PALETTE = {
  bg: "#FAF8F4",
  card: "#FFFFFF",
  text: "#3D342C",
  muted: "#8C7B6B",
  gold: "#C9974A",
  goldLt: "#E8C070",
  goldDk: "#A07030",
  border: "rgba(61,52,44,0.09)",
  surface: "#F5F0E8",
  mutedSurface: "#F0EBE3",
  sidebarBg: "#EDE8DF",
  mint: "#8DD4B8",
  destructive: "#E07A6A",
};

export const NEU_SHADOW = "4px 4px 14px rgba(61,52,44,0.07), -2px -2px 8px rgba(255,255,255,0.85)";
export const NEU_INSET = "inset 2px 2px 6px rgba(61,52,44,0.06), inset -2px -2px 6px rgba(255,255,255,0.75)";

export const DEFAULT_SUBJECT_COLORS = [
  { name: "Lavender", color: "#9580C8", colorDim: "rgba(149,128,200,0.14)" },
  { name: "Blue", color: "#5A9EC4", colorDim: "rgba(90,158,196,0.14)" },
  { name: "Coral", color: "#D98A72", colorDim: "rgba(217,138,114,0.14)" },
  { name: "Mint", color: "#8DD4B8", colorDim: "rgba(141,212,184,0.14)" },
  { name: "Gold", color: "#C9974A", colorDim: "rgba(201,151,74,0.14)" },
  { name: "Rose", color: "#D97A6A", colorDim: "rgba(217,122,106,0.14)" },
  { name: "Emerald", color: "#5EAD8A", colorDim: "rgba(94,173,138,0.14)" },
  { name: "Teal", color: "#4B9DA3", colorDim: "rgba(75,157,163,0.14)" },
];

export function getSubjectColorDim(hexColor: string): string {
  // Convert hex to rgba with 0.14 opacity
  const cleanHex = hexColor.replace("#", "");
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return `rgba(${r},${g},${b},0.14)`;
  }
  return "rgba(201,151,74,0.14)";
}
