import type { Metadata } from "next";
import { EventForm } from "@/components/event-form";
import { createEventAction } from "@/app/actions";

export const metadata: Metadata = {
  title: "Naujas įvykis",
  robots: { index: false, follow: false },
};

export default function NewEventPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-tight">Naujas įvykis</h1>
      <EventForm action={createEventAction} submitLabel="Sukurti" />
    </div>
  );
}
