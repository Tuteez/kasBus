import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, Pencil, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CopyLinkButton } from "@/components/copy-link-button";
import { DeleteEventButton } from "@/components/delete-event-button";
import { listEvents } from "@/lib/data";
import { formatShortDate, formatTime } from "@/lib/time";
import { EVENT_TYPE_LABELS, type TeamEvent } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Administravimas",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const events = await listEvents();
  const now = Date.now();
  const upcoming = events.filter((e) => new Date(e.dateTime).getTime() >= now);
  const past = events.filter((e) => new Date(e.dateTime).getTime() < now).reverse();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4">
        <div>
          <Link href="/" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
            ← Į pradžią
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Administravimas</h1>
        </div>
        <Button asChild className="h-12 text-base">
          <Link href="/admin/new">
            <Plus />
            Naujas įvykis
          </Link>
        </Button>
      </header>

      <EventSection title="Artėjantys" events={upcoming} emptyText="Artėjančių įvykių nėra." />
      {past.length > 0 && <EventSection title="Praėję" events={past} />}
    </div>
  );
}

function EventSection({ title, events, emptyText }: { title: string; events: TeamEvent[]; emptyText?: string }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">{title}</h2>
      {events.length === 0 ? (
        <p className="text-muted-foreground">{emptyText}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {events.map((event) => (
            <li key={event.id}>
              <AdminEventCard event={event} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function AdminEventCard({ event }: { event: TeamEvent }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg leading-tight font-semibold">{event.title}</h3>
            <p className="text-sm text-muted-foreground">
              {formatShortDate(event.dateTime)}, {formatTime(event.dateTime)} · {event.location}
            </p>
          </div>
          <Badge variant={event.type === "GAME" ? "default" : "secondary"}>{EVENT_TYPE_LABELS[event.type]}</Badge>
        </div>
        <CopyLinkButton eventId={event.id} className="h-11 w-full text-base" />
        <div className="grid grid-cols-3 gap-2">
          <Button asChild variant="outline" className="h-11">
            <Link href={`/event/${event.id}`}>
              <ExternalLink />
              Atidaryti
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-11">
            <Link href={`/admin/${event.id}/edit`}>
              <Pencil />
              Redaguoti
            </Link>
          </Button>
          <DeleteEventButton eventId={event.id} title={event.title} className="h-11" />
        </div>
      </CardContent>
    </Card>
  );
}
