import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { HomeEventList } from "@/components/home-event-list";
import { getAttendanceForEvents, getKnownPlayers, getTeam, listEvents } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Artėjantys įvykiai" };

// Keep events visible for a few hours after start so late responders can still find them.
const RECENT_WINDOW_MS = 3 * 60 * 60 * 1000;

export default async function HomePage() {
  const from = new Date(Date.now() - RECENT_WINDOW_MS).toISOString();
  const [team, events, knownPlayers] = await Promise.all([getTeam(), listEvents({ from }), getKnownPlayers()]);
  const attendance = await getAttendanceForEvents(events.map((e) => e.id));
  const items = events.map((event) => ({
    event,
    attendance: attendance.filter((a) => a.eventId === event.id),
  }));

  return (
    <div className="flex flex-col gap-5">
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
        <HomeEventList items={items} knownPlayers={knownPlayers} />
      )}

      <footer className="pt-4 text-center">
        <Link href="/admin" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
          Administravimas
        </Link>
      </footer>
    </div>
  );
}
