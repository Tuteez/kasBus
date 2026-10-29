"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { FormState } from "@/app/actions";
import { EVENT_TYPES, EVENT_TYPE_LABELS, type EventType } from "@/lib/types";

export type EventFormValues = {
  title: string;
  type: EventType;
  /** "YYYY-MM-DDTHH:mm" in team time zone. */
  dateTimeLocal: string;
  location: string;
  minimumPlayers: number;
  notes: string;
};

export function EventForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  defaultValues?: EventFormValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="title">Pavadinimas</Label>
        <Input
          id="title"
          name="title"
          required
          maxLength={120}
          placeholder="Pvz., Ketvirtadienio treniruotė"
          defaultValue={defaultValues?.title}
          className="h-12 text-base"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="type">Tipas</Label>
        <Select name="type" defaultValue={defaultValues?.type ?? "TRAINING"} required>
          <SelectTrigger id="type" className="h-12! w-full text-base">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EVENT_TYPES.map((t) => (
              <SelectItem key={t} value={t} className="py-3 text-base">
                {EVENT_TYPE_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="dateTime">Data ir laikas</Label>
        <Input
          id="dateTime"
          name="dateTime"
          type="datetime-local"
          required
          defaultValue={defaultValues?.dateTimeLocal}
          className="h-12 text-base"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="location">Vieta</Label>
        <Input
          id="location"
          name="location"
          required
          maxLength={200}
          placeholder="Pvz., Žalgirio arena, 2 aikštė"
          defaultValue={defaultValues?.location}
          className="h-12 text-base"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="minimumPlayers">Minimalus žaidėjų skaičius</Label>
        <Input
          id="minimumPlayers"
          name="minimumPlayers"
          type="number"
          inputMode="numeric"
          min={1}
          max={100}
          required
          defaultValue={defaultValues?.minimumPlayers ?? 8}
          className="h-12 text-base"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="notes">Pastabos</Label>
        <Textarea
          id="notes"
          name="notes"
          maxLength={2000}
          rows={4}
          placeholder="Pvz., atsineškite tamsius ir šviesius marškinėlius"
          defaultValue={defaultValues?.notes}
          className="text-base"
        />
      </div>

      {state.error && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="flex flex-col gap-3">
        <Button type="submit" disabled={pending} className="h-12 text-base">
          {pending ? "Saugoma…" : submitLabel}
        </Button>
        <Button asChild variant="ghost" className="h-12 text-base">
          <Link href="/admin">Atšaukti</Link>
        </Button>
      </div>
    </form>
  );
}
