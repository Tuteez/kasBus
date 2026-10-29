import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Clock, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { playersGenitive, summarizeAttendance, type AttendanceSummary } from "@/lib/attendance";
import { getAttendanceForEvents, getKnownPlayers, getTeam, listEvents } from "@/lib/data";
import { STATUS_STYLES } from "@/lib/status";
import { formatShortDate, formatTime } from "@/lib/time";
import { EVENT_TYPE_LABELS, type TeamEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Artėjantys įvykiai" };

// Keep events visible for a few hours after start so late responders can still find them.
const RECENT_WINDOW_MS = 3 * 60 * 60 * 1000;

export default async function HomePage() {
  const from = new Date(Date.now() - RECENT_WINDOW_MS).toISOString();
  const [team, events, knownPlayers] = await Promise.all([getTeam(), listEvents({ from }), getKnownPlayers()]);
  const attendance = await getAttendanceForEvents(events.map((e) => e.id));

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-sm font-medium text-orange-600">🏀 {team?.name ?? "kasBus"}</p>
        <h1 className="text-2xl font-bold tracking-tight">Artėjantys įvykiai</h1>
      </header>

      {events.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-center text-muted-foreground">
            Artėjančių treniruočių ar varžybų nėra.
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {events.map((event) => (
            <li key={event.id}>
              <EventLinkCard
                event={event}
                summary={summarizeAttendance(
                  attendance.filter((a) => a.eventId === event.id),
                  knownPlayers,
                  event.minimumPlayers,
                )}
              />
            </li>
          ))}
        </ul>
      )}

      <footer className="pt-4 text-center">
        <Link href="/admin" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
          Administravimas
        </Link>
      </footer>
    </div>
  );
}

function EventLinkCard({ event, summary }: { event: TeamEvent; summary: AttendanceSummary }) {
  const status = STATUS_STYLES[summary.status];
  const yes = summary.names.YES.length;

  return (
    <Link href={`/event/${event.id}`} className="block rounded-xl active:scale-[0.99]">
      <Card className={cn("border-l-4 transition-colors hover:bg-muted/60", status.accent)}>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg leading-tight font-semibold">{event.title}</h2>
            <Badge variant={event.type === "GAME" ? "default" : "secondary"}>{EVENT_TYPE_LABELS[event.type]}</Badge>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-4" />
              {formatShortDate(event.dateTime)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="size-4" />
              {formatTime(event.dateTime)}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="size-4" />
              {event.location}
            </span>
          </div>

          <div className={cn("flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-lg border px-3 py-2", status.banner)}>
            <span className="text-base font-bold">{status.label}</span>
            <span className="text-sm">
              {summary.status === "GOING"
                ? `${yes} iš ${event.minimumPlayers} reikalingų`
                : `Trūksta dar ${summary.missingPlayers} ${playersGenitive(summary.missingPlayers)}`}
            </span>
          </div>

          <dl className="grid grid-cols-4 gap-2 text-center">
            <CountCell emoji="✅" label="Dalyvaus" count={yes} />
            <CountCell emoji="❓" label="Galbūt" count={summary.names.MAYBE.length} />
            <CountCell emoji="❌" label="Nedalyvaus" count={summary.names.NO.length} />
            <CountCell emoji="⏳" label="Neatsakė" count={summary.noResponse.length} />
          </dl>
        </CardContent>
      </Card>
    </Link>
  );
}

function CountCell({ emoji, label, count }: { emoji: string; label: string; count: number }) {
  return (
    <div className="flex flex-col items-center rounded-lg bg-muted/60 py-1.5" title={label}>
      <dt className="sr-only">{label}</dt>
      <dd className="flex items-center gap-1 text-lg font-bold tabular-nums">
        <span aria-hidden="true" className="text-base">
          {emoji}
        </span>
        {count}
      </dd>
      <span aria-hidden="true" className="text-[11px] text-muted-foreground">
        {label}
      </span>
    </div>
  );
}
