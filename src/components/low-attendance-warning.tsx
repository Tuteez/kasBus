import { lowAttendanceWarning } from "@/lib/attendance";
import { cn } from "@/lib/utils";

export function LowAttendanceWarning({ yes, className }: { yes: number; className?: string }) {
  const text = lowAttendanceWarning(yes);
  if (!text) return null;
  return (
    <p
      role="status"
      className={cn(
        "rounded-lg border border-orange-300 bg-orange-100 px-3 py-2 text-sm font-semibold text-orange-900",
        className,
      )}
    >
      {text}
    </p>
  );
}
