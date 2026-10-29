"use client";

import { useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { CalendarDays, ChevronRight, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { NameForm, PLAYER_NAME_INPUT_ID } from "@/components/name-form";
import { setAttendanceAction } from "@/app/actions";
import { useAutoRefresh } from "@/hooks/use-auto-refresh";
import { usePlayerName } from "@/hooks/use-player-name";
import { applyResponse, findResponse, playersGenitive, summarizeAttendance } from "@/lib/attendance";
import { STATUS_STYLES } from "@/lib/status";
import { formatShortDate, formatTime } from "@/lib/time";
import { EVENT_TYPE_LABELS, type Attendance, type AttendanceResponse, type TeamEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

export type HomeEvent = { event: TeamEvent; attendance: Attendance[] };

const QUICK_ACTIONS: { value: AttendanceResponse; emoji: string; label: string; active: string }[] = [
  { value: "YES", emoji: "✅", label: "Dalyvausiu", active: "border-2 border-green-600 bg-green-100 ring-green-600/30 hover:bg-green-100" },
  { value: "MAYBE", emoji: "❓", label: "Galbūt", active: "border-2 border-amber-500 bg-amber-100 ring-amber-500/30 hover:bg-amber-100" },
  { value: "NO", emoji: "❌", label: "Nedalyvausiu", active: "border-2 border-red-600 bg-red-100 ring-red-600/30 hover:bg-red-100" },
];

const MY_RESPONSE_LABELS: Record<AttendanceResponse | "NONE", { text: string; className: string }> = {
  YES: { text: "✅ Tu dalyvausi", className: "bg-green-100 text-green-900" },
  MAYBE: { text: "❓ Tu galbūt dalyvausi", className: "bg-amber-100 text-amber-900" },
  NO: { text: "❌ Tu nedalyvausi", className: "bg-red-100 text-red-900" },
  NONE: { text: "⏳ Neatsakei", className: "bg-muted text-muted-foreground" },
};

export function HomeEventList({ items, knownPlayers }: { items: HomeEvent[]; knownPlayers: string[] }) {
  const { playerName, loaded, savePlayerName } = usePlayerName();
  const [editingName, setEditingName] = useState(false);

  useAutoRefresh();

  return (
    <div className="flex flex-col gap-4">
      {loaded && (!playerName || editingName) ? (
        <Card>
          <CardContent>
            <NameForm
              initialName={editingName ? (playerName ?? "") : ""}
              autoFocus={editingName}
              onSubmit={(name) => {
                savePlayerName(name);
                setEditingName(false);
              }}
              onCancel={editingName ? () => setEditingName(false) : undefined}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="flex min-h-10 items-center justify-between gap-3">
          {playerName && (
            <>
              <p className="text-base">
                Sveiki, <span className="font-semibold">{playerName}</span>
              </p>
              <Button variant="link" className="h-10 px-0 text-base" onClick={() => setEditingName(true)}>
                Keisti vardą
              </Button>
            </>
          )}
        </div>
      )}

      <ul className="flex flex-col gap-4">
        {items.map(({ event, attendance }) => (
          <li key={event.id}>
            <HomeEventCard
              event={event}
              attendance={attendance}
              knownPlayers={knownPlayers}
              playerName={loaded ? playerName : null}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function HomeEventCard({
  event,
  attendance,
  knownPlayers,
  playerName,
}: {
  event: TeamEvent;
  attendance: Attendance[];
  knownPlayers: string[];
  playerName: string | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [optimisticAttendance, applyOptimistic] = useOptimistic(
    attendance,
    (current: Attendance[], response: AttendanceResponse) =>
      playerName ? applyResponse(current, event.id, playerName, response) : current,
  );

  const summary = summarizeAttendance(optimisticAttendance, knownPlayers, event.minimumPlayers);
  const status = STATUS_STYLES[summary.status];
  const myResponse = findResponse(optimisticAttendance, playerName);
  const mine = MY_RESPONSE_LABELS[myResponse ?? "NONE"];
  const eventHref = `/event/${event.id}`;

  function respond(response: AttendanceResponse) {
    if (!playerName) {
      const input = document.getElementById(PLAYER_NAME_INPUT_ID);
      input?.scrollIntoView({ behavior: "smooth", block: "center" });
      input?.focus();
      return;
    }
    setError(null);
    startTransition(async () => {
      applyOptimistic(response);
      const result = await setAttendanceAction(event.id, playerName, response);
      if (result.error) setError(result.error);
    });
  }

  return (
    <Card className={cn("gap-0 border-l-4 py-0", status.accent)}>
      <CardContent className="flex flex-col gap-3 px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg leading-tight font-semibold">
            <Link href={eventHref} className="underline-offset-4 hover:underline">
              🏀 {event.title}
            </Link>
          </h2>
          <Badge variant={event.type === "GAME" ? "default" : "secondary"}>{EVENT_TYPE_LABELS[event.type]}</Badge>
        </div>

        <div
          className={cn(
            "flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 rounded-lg border px-3 py-2",
            status.banner,
          )}
        >
          <span className="text-base font-bold">{status.label}</span>
          <span className="text-sm">
            {summary.status === "GOING"
              ? `${summary.names.YES.length} iš ${event.minimumPlayers} reikalingų`
              : `Trūksta dar ${summary.missingPlayers} ${playersGenitive(summary.missingPlayers)}`}
          </span>
        </div>

        <dl className="grid grid-cols-4 gap-2 text-center">
          <CountCell emoji="✅" label="Dalyvaus" count={summary.names.YES.length} />
          <CountCell emoji="❓" label="Galbūt" count={summary.names.MAYBE.length} />
          <CountCell emoji="❌" label="Nedalyvaus" count={summary.names.NO.length} />
          <CountCell emoji="⏳" label="Neatsakė" count={summary.noResponse.length} />
        </dl>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-muted-foreground">Tavo atsakymas:</span>
            <span className={cn("rounded-full px-2.5 py-1 text-sm font-semibold", mine.className)}>{mine.text}</span>
          </div>
          <div className="grid grid-cols-3 gap-2" role="group" aria-label="Tavo atsakymas">
            {QUICK_ACTIONS.map((action) => {
              const selected = myResponse === action.value;
              return (
                <Button
                  key={action.value}
                  type="button"
                  variant="outline"
                  aria-pressed={selected}
                  aria-label={action.label}
                  title={action.label}
                  onClick={() => respond(action.value)}
                  className={cn(
                    "h-14 rounded-xl text-2xl transition-transform active:scale-95",
                    selected && action.active,
                    selected && "ring-4",
                    !selected && myResponse && "opacity-60",
                  )}
                >
                  {action.emoji}
                </Button>
              );
            })}
          </div>
          {error && (
            <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
        </div>

        <Link
          href={eventHref}
          className="-mx-4 -mb-4 flex items-center gap-3 rounded-b-xl border-t px-4 py-3 text-sm text-muted-foreground hover:bg-muted/60"
        >
          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-4 shrink-0" />
              <span className="first-letter:uppercase">{formatShortDate(event.dateTime)}</span>
              <span className="font-semibold text-foreground">{formatTime(event.dateTime)}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="size-4 shrink-0" />
              <span className="truncate">{event.location}</span>
            </span>
          </span>
          <span className="flex shrink-0 items-center text-foreground">
            Daugiau
            <ChevronRight className="size-4" />
          </span>
        </Link>
      </CardContent>
    </Card>
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
