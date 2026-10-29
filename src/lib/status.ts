import type { EventStatus } from "./attendance";

export const STATUS_STYLES: Record<
  EventStatus,
  { label: string; banner: string; badge: string; accent: string }
> = {
  GOING: {
    label: "🟢 Susirenkam",
    banner: "border-green-200 bg-green-50 text-green-900",
    badge: "bg-green-100 text-green-900 ring-green-300",
    accent: "border-l-green-500",
  },
  SHORT: {
    label: "🟡 Trūksta žaidėjų",
    banner: "border-amber-200 bg-amber-50 text-amber-900",
    badge: "bg-amber-100 text-amber-900 ring-amber-300",
    accent: "border-l-amber-400",
  },
  CANCELLED: {
    label: "🔴 Nesusirenkam",
    banner: "border-red-200 bg-red-50 text-red-900",
    badge: "bg-red-100 text-red-900 ring-red-300",
    accent: "border-l-red-500",
  },
};
