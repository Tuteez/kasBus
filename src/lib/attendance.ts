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
 * There is no roster table, so "Neatsakė" means `knownPlayers` without a response to this event.
 * `knownPlayers` may include or exclude this event's own responders: they are filtered out
 * either way, but excluding them keeps optimistic deletes/renames exact.
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

/** Replaces (or adds) one player's response; used for optimistic UI updates. */
export function applyResponse(
  current: Attendance[],
  eventId: string,
  playerName: string,
  response: AttendanceResponse,
): Attendance[] {
  const key = playerKey(playerName);
  return [
    ...current.filter((a) => playerKey(a.playerName) !== key),
    { id: `optimistic-${key}`, eventId, playerName, response, updatedAt: new Date().toISOString() },
  ];
}

export function findResponse(attendance: Attendance[], playerName: string | null): AttendanceResponse | undefined {
  if (!playerName) return undefined;
  const key = playerKey(playerName);
  return attendance.find((a) => playerKey(a.playerName) === key)?.response;
}

export const LOW_ATTENDANCE_THRESHOLD = 5;

/** Lithuanian noun form by count: 1/21 → one, 2–9/22–29 → few, 0/10–20 → many. */
function pluralLt(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && (mod100 < 10 || mod100 > 20)) return few;
  return many;
}

/** Warning text shown when fewer than LOW_ATTENDANCE_THRESHOLD players confirmed, otherwise null. */
export function lowAttendanceWarning(yes: number): string | null {
  if (yes >= LOW_ATTENDANCE_THRESHOLD) return null;
  if (yes === 0) return "⚠️ Kol kas nėra patvirtinimų";
  return `⚠️ Kol kas tik ${yes} ${pluralLt(yes, "patvirtinimas", "patvirtinimai", "patvirtinimų")}`;
}

export type AttendanceChange =
  | { type: "set"; playerName: string; response: AttendanceResponse }
  | { type: "edit"; id: string; playerName: string; response: AttendanceResponse }
  | { type: "delete"; id: string }
  | { type: "clear" };

/** Pure reducer used for optimistic UI updates. */
export function applyAttendanceChange(current: Attendance[], eventId: string, change: AttendanceChange): Attendance[] {
  switch (change.type) {
    case "set":
      return applyResponse(current, eventId, change.playerName, change.response);
    case "edit":
      return current.map((a) =>
        a.id === change.id
          ? { ...a, playerName: change.playerName, response: change.response, updatedAt: new Date().toISOString() }
          : a,
      );
    case "delete":
      return current.filter((a) => a.id !== change.id);
    case "clear":
      return [];
  }
}

/** Lithuanian genitive after "trūksta": 1 žaidėjo, 2 žaidėjų, 21 žaidėjo, 11 žaidėjų. */
export function playersGenitive(n: number): string {
  return n % 10 === 1 && n % 100 !== 11 ? "žaidėjo" : "žaidėjų";
}
