"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteEventAction } from "@/app/actions";

export function DeleteEventButton({
  eventId,
  title,
  className,
}: {
  eventId: string;
  title: string;
  className?: string;
}) {
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!window.confirm(`Ar tikrai ištrinti „${title}“? Bus ištrinti ir visi atsakymai.`)) return;
    startTransition(async () => {
      const result = await deleteEventAction(eventId);
      if (result.error) window.alert(result.error);
    });
  }

  return (
    <Button type="button" variant="destructive" className={className} disabled={pending} onClick={onClick}>
      <Trash2 />
      {pending ? "Trinama…" : "Ištrinti"}
    </Button>
  );
}
