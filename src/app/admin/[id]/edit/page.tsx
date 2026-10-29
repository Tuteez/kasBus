import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventForm } from "@/components/event-form";
import { updateEventAction } from "@/app/actions";
import { getEvent } from "@/lib/data";
import { toLocalInputValue } from "@/lib/time";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Redaguoti įvykį",
  robots: { index: false, follow: false },
};

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-tight">Redaguoti įvykį</h1>
      <EventForm
        action={updateEventAction.bind(null, event.id)}
        submitLabel="Išsaugoti"
        defaultValues={{
          title: event.title,
          type: event.type,
          dateTimeLocal: toLocalInputValue(event.dateTime),
          location: event.location,
          minimumPlayers: event.minimumPlayers,
          notes: event.notes ?? "",
        }}
      />
    </div>
  );
}
