import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Clock, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getTeam, listEvents } from "@/lib/data";
import { formatShortDate, formatTime } from "@/lib/time";
import { EVENT_TYPE_LABELS, type TeamEvent } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Artėjantys įvykiai" };

// Keep events visible for a few hours after start so late responders can still find them.
const RECENT_WINDOW_MS = 3 * 60 * 60 * 1000;

export default async function HomePage() {
  const from = new Date(Date.now() - RECENT_WINDOW_MS).toISOString();
  const [team, events] = await Promise.all([getTeam(), listEvents({ from })]);

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
              <EventLinkCard event={event} />
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

function EventLinkCard({ event }: { event: TeamEvent }) {
  return (
    <Link href={`/event/${event.id}`} className="block rounded-xl active:scale-[0.99]">
      <Card className="transition-colors hover:bg-muted/60">
        <CardContent className="flex flex-col gap-2">
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
        </CardContent>
      </Card>
    </Link>
  );
}
