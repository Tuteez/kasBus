import "server-only";
import { cache } from "react";
import { getSupabase } from "./supabase";
import { playerKey } from "./attendance";
import type { Attendance, AttendanceResponse, EventType, Team, TeamEvent } from "./types";

type EventRow = {
  id: string;
  title: string;
  type: EventType;
  date_time: string;
  location: string;
  minimum_players: number;
  notes: string | null;
};

type AttendanceRow = {
  id: string;
  event_id: string;
  player_name: string;
  response: AttendanceResponse;
  updated_at: string;
};

const EVENT_COLUMNS = "id,title,type,date_time,location,minimum_players,notes";

function toEvent(row: EventRow): TeamEvent {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    dateTime: row.date_time,
    location: row.location,
    minimumPlayers: row.minimum_players,
    notes: row.notes,
  };
}

function toAttendance(row: AttendanceRow): Attendance {
  return {
    id: row.id,
    eventId: row.event_id,
    playerName: row.player_name,
    response: row.response,
    updatedAt: row.updated_at,
  };
}

export type EventInput = Omit<TeamEvent, "id">;

function toRow(input: EventInput) {
  return {
    title: input.title,
    type: input.type,
    date_time: input.dateTime,
    location: input.location,
    minimum_players: input.minimumPlayers,
    notes: input.notes,
  };
}

export async function getTeam(): Promise<Team | null> {
  const { data, error } = await getSupabase().from("team").select("id,name").limit(1).maybeSingle();
  if (error) throw error;
  return data;
}

export async function listEvents(options: { from?: string } = {}): Promise<TeamEvent[]> {
  let query = getSupabase().from("events").select(EVENT_COLUMNS).order("date_time", { ascending: true });
  if (options.from) query = query.gte("date_time", options.from);
  const { data, error } = await query;
  if (error) throw error;
  return (data as EventRow[]).map(toEvent);
}

export const getEvent = cache(async (id: string): Promise<TeamEvent | null> => {
  const { data, error } = await getSupabase().from("events").select(EVENT_COLUMNS).eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? toEvent(data as EventRow) : null;
});

function generateEventId(): string {
  const alphabet = "abcdefghijkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

export async function createEvent(input: EventInput): Promise<string> {
  const id = generateEventId();
  const { error } = await getSupabase().from("events").insert({ id, ...toRow(input) });
  if (error) throw error;
  return id;
}

export async function updateEvent(id: string, input: EventInput): Promise<void> {
  const { error } = await getSupabase().from("events").update(toRow(input)).eq("id", id);
  if (error) throw error;
}

export async function deleteEvent(id: string): Promise<void> {
  const { error } = await getSupabase().from("events").delete().eq("id", id);
  if (error) throw error;
}

export async function getAttendance(eventId: string): Promise<Attendance[]> {
  const { data, error } = await getSupabase()
    .from("attendance")
    .select("id,event_id,player_name,response,updated_at")
    .eq("event_id", eventId);
  if (error) throw error;
  return (data as AttendanceRow[]).map(toAttendance);
}

export async function getAttendanceForEvents(eventIds: string[]): Promise<Attendance[]> {
  if (eventIds.length === 0) return [];
  const { data, error } = await getSupabase()
    .from("attendance")
    .select("id,event_id,player_name,response,updated_at")
    .in("event_id", eventIds);
  if (error) throw error;
  return (data as AttendanceRow[]).map(toAttendance);
}

export class DuplicatePlayerError extends Error {}

export async function updateAttendanceEntry(
  id: string,
  eventId: string,
  playerName: string,
  response: AttendanceResponse,
): Promise<void> {
  const { error } = await getSupabase()
    .from("attendance")
    .update({ player_name: playerName, response, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("event_id", eventId);
  if (error?.code === "23505") throw new DuplicatePlayerError();
  if (error) throw error;
}

export async function deleteAttendanceEntry(id: string, eventId: string): Promise<void> {
  const { error } = await getSupabase().from("attendance").delete().eq("id", id).eq("event_id", eventId);
  if (error) throw error;
}

export async function clearAttendance(eventId: string): Promise<void> {
  const { error } = await getSupabase().from("attendance").delete().eq("event_id", eventId);
  if (error) throw error;
}

/** Distinct player names that have ever responded, using the most recent spelling. */
export async function getKnownPlayers(): Promise<string[]> {
  const { data, error } = await getSupabase()
    .from("attendance")
    .select("player_name,updated_at")
    .order("updated_at", { ascending: false })
    .limit(5000);
  if (error) throw error;

  const byKey = new Map<string, string>();
  for (const row of data as Pick<AttendanceRow, "player_name">[]) {
    const key = playerKey(row.player_name);
    if (!byKey.has(key)) byKey.set(key, row.player_name);
  }
  return [...byKey.values()];
}

export async function upsertAttendance(
  eventId: string,
  playerName: string,
  response: AttendanceResponse,
): Promise<void> {
  const { error } = await getSupabase()
    .from("attendance")
    .upsert(
      { event_id: eventId, player_name: playerName, response, updated_at: new Date().toISOString() },
      { onConflict: "event_id,player_key" },
    );
  if (error) throw error;
}
