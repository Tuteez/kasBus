import type { StatusTone } from "./attendance";

export const STATUS_STYLES: Record<StatusTone, { banner: string; accent: string }> = {
  green: { banner: "border-green-200 bg-green-50 text-green-900", accent: "border-l-green-500" },
  yellow: { banner: "border-amber-200 bg-amber-50 text-amber-900", accent: "border-l-amber-400" },
  orange: { banner: "border-orange-300 bg-orange-100 text-orange-900", accent: "border-l-orange-500" },
  red: { banner: "border-red-200 bg-red-50 text-red-900", accent: "border-l-red-500" },
};
