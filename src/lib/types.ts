export const EVENT_TYPES = ["TRAINING", "GAME"] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const RESPONSES = ["YES", "MAYBE", "NO"] as const;
export type AttendanceResponse = (typeof RESPONSES)[number];

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  TRAINING: "Treniruotė",
  GAME: "Varžybos",
};

export type Team = {
  id: string;
  name: string;
};

export type TeamEvent = {
  id: string;
  title: string;
  type: EventType;
  dateTime: string;
  location: string;
  minimumPlayers: number;
  notes: string | null;
};

export type Attendance = {
  id: string;
  eventId: string;
  playerName: string;
  response: AttendanceResponse;
  updatedAt: string;
};
