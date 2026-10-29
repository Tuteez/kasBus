import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Clock, MapPin, StickyNote } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AttendancePanel } from "@/components/attendance-panel";
import { getAttendance, getEvent, getKnownPlayers } from "@/lib/data";
import { formatDate, formatShortDate, formatTime } from "@/lib/time";
import { EVENT_TYPE_LABELS } from "@/lib/types";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) return { title: "Įvykis nerastas" };

  const title = `${event.title} – ${formatShortDate(event.dateTime)}, ${formatTime(event.dateTime)}`;
  const description = `${EVENT_TYPE_LABELS[event.type]} · ${event.location}. Pažymėkite, ar dalyvausite.`;
  return { title, description, openGraph: { title, description, type: "website" } };
}

export default async function EventPage({ params }: Props) {
  const { id } = await params;
  const [event, attendance, knownPlayers] = await Promise.all([
    getEvent(id),
    getAttendance(id),
    getKnownPlayers({ excludeEventId: id }),
  ]);
  if (!event) notFound();

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`;

  return (
    <div className="flex flex-col gap-5">
      <Link href="/" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
        ← Visi įvykiai
      </Link>

      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col items-start gap-2">
            <Badge variant={event.type === "GAME" ? "default" : "secondary"}>{EVENT_TYPE_LABELS[event.type]}</Badge>
            <h1 className="text-2xl leading-tight font-bold tracking-tight">{event.title}</h1>
          </div>

          <dl className="grid gap-3 text-base">
            <DetailRow icon={<CalendarDays />} label="Data">
              <span className="first-letter:uppercase">{formatDate(event.dateTime)}</span>
            </DetailRow>
            <DetailRow icon={<Clock />} label="Laikas">
              {formatTime(event.dateTime)}
            </DetailRow>
            <DetailRow icon={<MapPin />} label="Vieta">
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
                {event.location}
              </a>
            </DetailRow>
            {event.notes && (
              <DetailRow icon={<StickyNote />} label="Pastabos">
                <span className="whitespace-pre-wrap">{event.notes}</span>
              </DetailRow>
            )}
          </dl>
        </CardContent>
      </Card>

      <AttendancePanel
        eventId={event.id}
        eventType={event.type}
        attendance={attendance}
        knownPlayers={knownPlayers}
      />
    </div>
  );
}

function DetailRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 text-muted-foreground [&_svg]:size-5">{icon}</span>
      <div className="min-w-0">
        <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</dt>
        <dd className="break-words">{children}</dd>
      </div>
    </div>
  );
}
