"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as data from "@/lib/data";
import { normalizePlayerName } from "@/lib/attendance";
import { fromLocalInputValue } from "@/lib/time";
import { EVENT_TYPES, RESPONSES, type AttendanceResponse, type EventType } from "@/lib/types";

export type FormState = { error?: string };

function parseEventForm(formData: FormData): data.EventInput | string {
  const title = String(formData.get("title") ?? "").trim();
  const type = String(formData.get("type") ?? "");
  const dateTimeLocal = String(formData.get("dateTime") ?? "");
  const location = String(formData.get("location") ?? "").trim();
  const minimumPlayers = Number(formData.get("minimumPlayers"));
  const notes = String(formData.get("notes") ?? "").trim();

  if (!title) return "Įveskite pavadinimą.";
  if (title.length > 120) return "Pavadinimas per ilgas (daugiausia 120 simbolių).";
  if (!EVENT_TYPES.includes(type as EventType)) return "Pasirinkite tipą.";
  const dateTime = fromLocalInputValue(dateTimeLocal);
  if (!dateTime) return "Nurodykite datą ir laiką.";
  if (!location) return "Įveskite vietą.";
  if (location.length > 200) return "Vietos pavadinimas per ilgas.";
  if (!Number.isInteger(minimumPlayers) || minimumPlayers < 1 || minimumPlayers > 100) {
    return "Minimalus žaidėjų skaičius turi būti nuo 1 iki 100.";
  }
  if (notes.length > 2000) return "Pastabos per ilgos (daugiausia 2000 simbolių).";

  return { title, type: type as EventType, dateTime, location, minimumPlayers, notes: notes || null };
}

export async function createEventAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const input = parseEventForm(formData);
  if (typeof input === "string") return { error: input };
  try {
    await data.createEvent(input);
  } catch (e) {
    console.error(e);
    return { error: "Nepavyko išsaugoti. Bandykite dar kartą." };
  }
  revalidatePath("/", "layout");
  redirect("/admin");
}

export async function updateEventAction(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const input = parseEventForm(formData);
  if (typeof input === "string") return { error: input };
  try {
    await data.updateEvent(id, input);
  } catch (e) {
    console.error(e);
    return { error: "Nepavyko išsaugoti. Bandykite dar kartą." };
  }
  revalidatePath("/", "layout");
  redirect("/admin");
}

export async function deleteEventAction(id: string): Promise<FormState> {
  try {
    await data.deleteEvent(id);
  } catch (e) {
    console.error(e);
    return { error: "Nepavyko ištrinti. Bandykite dar kartą." };
  }
  revalidatePath("/", "layout");
  return {};
}

function revalidateAttendance(eventId: string) {
  revalidatePath("/");
  revalidatePath(`/event/${eventId}`);
}

export async function updateAttendanceEntryAction(
  id: string,
  eventId: string,
  rawName: string,
  response: AttendanceResponse,
): Promise<FormState> {
  const playerName = normalizePlayerName(rawName);
  if (!playerName || playerName.length > 40) return { error: "Netinkamas vardas." };
  if (!RESPONSES.includes(response)) return { error: "Netinkamas atsakymas." };
  try {
    await data.updateAttendanceEntry(id, eventId, playerName, response);
  } catch (e) {
    if (e instanceof data.DuplicatePlayerError) return { error: `„${playerName}“ jau yra sąraše.` };
    console.error(e);
    return { error: "Nepavyko išsaugoti. Bandykite dar kartą." };
  }
  revalidateAttendance(eventId);
  return {};
}

export async function deleteAttendanceEntryAction(id: string, eventId: string): Promise<FormState> {
  try {
    await data.deleteAttendanceEntry(id, eventId);
  } catch (e) {
    console.error(e);
    return { error: "Nepavyko ištrinti. Bandykite dar kartą." };
  }
  revalidateAttendance(eventId);
  return {};
}

export async function clearAttendanceAction(eventId: string): Promise<FormState> {
  try {
    await data.clearAttendance(eventId);
  } catch (e) {
    console.error(e);
    return { error: "Nepavyko išvalyti. Bandykite dar kartą." };
  }
  revalidateAttendance(eventId);
  return {};
}

export async function setAttendanceAction(
  eventId: string,
  rawName: string,
  response: AttendanceResponse,
): Promise<FormState> {
  const playerName = normalizePlayerName(rawName);
  if (!playerName || playerName.length > 40) return { error: "Netinkamas vardas." };
  if (!RESPONSES.includes(response)) return { error: "Netinkamas atsakymas." };

  try {
    const event = await data.getEvent(eventId);
    if (!event) return { error: "Įvykis nerastas." };
    await data.upsertAttendance(eventId, playerName, response);
  } catch (e) {
    console.error(e);
    return { error: "Nepavyko išsaugoti. Bandykite dar kartą." };
  }
  revalidateAttendance(eventId);
  return {};
}
