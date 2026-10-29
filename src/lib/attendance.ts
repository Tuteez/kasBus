import type { Attendance, AttendanceResponse } from "./types";

export type EventStatus = "GOING" | "SHORT" | "CANCELLED";

export type AttendanceSummary = {
  names: Record<AttendanceResponse, string[]>;
  noResponse: string[];
  status: EventStatus;
  missingPlayers: number;
};

export function normalizePlayerName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

export function playerKey(name: string): string {
  return normalizePlayerName(name).toLowerCase();
}

export function calculateStatus(
  yes: number,
  maybe: number,
  minimumPlayers: number,
): { status: EventStatus; missingPlayers: number } {
  const missingPlayers = Math.max(0, minimumPlayers - yes);
  if (yes >= minimumPlayers) return { status: "GOING", missingPlayers };
  if (yes + maybe >= minimumPlayers) return { status: "SHORT", missingPlayers };
  return { status: "CANCELLED", missingPlayers };
}

/**
 * `knownPlayers` is every name that has ever responded to any event; there is no
 * roster table, so "Neatsakė" means known players without a response to this event.
 */
export function summarizeAttendance(
  attendance: Attendance[],
  knownPlayers: string[],
  minimumPlayers: number,
): AttendanceSummary {
  const names: Record<AttendanceResponse, string[]> = { YES: [], MAYBE: [], NO: [] };
  const responded = new Set<string>();

  const sorted = [...attendance].sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
  for (const row of sorted) {
    names[row.response].push(row.playerName);
    responded.add(playerKey(row.playerName));
  }

  const noResponseByKey = new Map<string, string>();
  for (const name of knownPlayers) {
    const key = playerKey(name);
    if (!responded.has(key) && !noResponseByKey.has(key)) noResponseByKey.set(key, name);
  }
  const noResponse = [...noResponseByKey.values()].sort((a, b) => a.localeCompare(b, "lt"));

  return {
    names,
    noResponse,
    ...calculateStatus(names.YES.length, names.MAYBE.length, minimumPlayers),
  };
}

/** Lithuanian genitive after "trūksta": 1 žaidėjo, 2 žaidėjų, 21 žaidėjo, 11 žaidėjų. */
export function playersGenitive(n: number): string {
  return n % 10 === 1 && n % 100 !== 11 ? "žaidėjo" : "žaidėjų";
}
