"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { normalizePlayerName } from "@/lib/attendance";
import { RESPONSES, type Attendance, type AttendanceResponse } from "@/lib/types";
import { cn } from "@/lib/utils";

export const RESPONSE_EMOJI: Record<AttendanceResponse, string> = { YES: "✅", MAYBE: "❓", NO: "❌" };

const RESPONSE_GROUP_TITLES: Record<AttendanceResponse, string> = {
  YES: "✅ Dalyvaus",
  MAYBE: "❓ Galbūt",
  NO: "❌ Nedalyvaus",
};

const RESPONSE_OPTION_LABELS: Record<AttendanceResponse, string> = {
  YES: "✅ Taip",
  MAYBE: "❓ Galbūt",
  NO: "❌ Ne",
};

const SELECTED_STYLES: Record<AttendanceResponse, string> = {
  YES: "border-2 border-green-600 bg-green-100 hover:bg-green-100",
  MAYBE: "border-2 border-amber-500 bg-amber-100 hover:bg-amber-100",
  NO: "border-2 border-red-600 bg-red-100 hover:bg-red-100",
};

export function AdminAttendanceManager({
  attendance,
  onEdit,
  onDelete,
  onClear,
  onExitAdmin,
}: {
  attendance: Attendance[];
  onEdit: (entry: Attendance, playerName: string, response: AttendanceResponse) => void;
  onDelete: (entry: Attendance) => void;
  onClear: () => void;
  onExitAdmin: () => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const sorted = [...attendance].sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));

  return (
    <section className="flex flex-col gap-4 rounded-xl border-2 border-dashed border-slate-300 bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold">🛠️ Atsakymų valdymas</h2>
        <Button variant="link" className="h-10 px-0 text-sm text-muted-foreground" onClick={onExitAdmin}>
          Išjungti admin režimą
        </Button>
      </div>

      {RESPONSES.map((response) => {
        const entries = sorted.filter((a) => a.response === response);
        return (
          <div key={response} className="flex flex-col gap-2">
            <h3 className="font-semibold">
              {RESPONSE_GROUP_TITLES[response]}{" "}
              <span className="font-normal text-muted-foreground">({entries.length})</span>
            </h3>
            {entries.length === 0 ? (
              <p className="text-sm text-muted-foreground">—</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {entries.map((entry) =>
                  editingId === entry.id ? (
                    <li key={entry.id}>
                      <EditEntryForm
                        entry={entry}
                        onCancel={() => setEditingId(null)}
                        onSave={(name, newResponse) => {
                          setEditingId(null);
                          onEdit(entry, name, newResponse);
                        }}
                      />
                    </li>
                  ) : (
                    <li key={entry.id} className="flex flex-col gap-2 rounded-lg border p-3">
                      <p className="text-base font-medium break-words">
                        {RESPONSE_EMOJI[entry.response]} {entry.playerName}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          className="h-11"
                          disabled={entry.id.startsWith("optimistic-")}
                          onClick={() => setEditingId(entry.id)}
                        >
                          <Pencil />
                          Redaguoti
                        </Button>
                        <ConfirmButton
                          triggerLabel={
                            <>
                              <Trash2 />
                              Ištrinti
                            </>
                          }
                          disabled={entry.id.startsWith("optimistic-")}
                          title={`Ištrinti „${entry.playerName}“ atsakymą?`}
                          description="Žaidėjas bus pašalintas iš šio įvykio sąrašo."
                          confirmLabel="Ištrinti"
                          onConfirm={() => onDelete(entry)}
                        />
                      </div>
                    </li>
                  ),
                )}
              </ul>
            )}
          </div>
        );
      })}

      <ConfirmButton
        triggerLabel="🧹 Išvalyti visus atsakymus"
        triggerClassName="h-12 text-base"
        disabled={attendance.length === 0}
        title="Išvalyti visus atsakymus?"
        description={`Bus ištrinti visi šio įvykio atsakymai (${attendance.length}). Pats įvykis liks.`}
        confirmLabel="Išvalyti"
        onConfirm={onClear}
      />
    </section>
  );
}

function EditEntryForm({
  entry,
  onSave,
  onCancel,
}: {
  entry: Attendance;
  onSave: (playerName: string, response: AttendanceResponse) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(entry.playerName);
  const [response, setResponse] = useState<AttendanceResponse>(entry.response);
  const normalized = normalizePlayerName(name);

  return (
    <form
      className="flex flex-col gap-3 rounded-lg border-2 border-primary/40 bg-muted/40 p-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (normalized) onSave(normalized, response);
      }}
    >
      <Input
        aria-label="Žaidėjo vardas"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={40}
        autoFocus
        className="h-12 text-base"
      />
      <div className="grid grid-cols-3 gap-2" role="group" aria-label="Atsakymas">
        {RESPONSES.map((r) => (
          <Button
            key={r}
            type="button"
            variant="outline"
            aria-pressed={response === r}
            onClick={() => setResponse(r)}
            className={cn("h-12 text-sm", response === r && SELECTED_STYLES[r])}
          >
            {RESPONSE_OPTION_LABELS[r]}
          </Button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="ghost" className="h-11" onClick={onCancel}>
          Atšaukti
        </Button>
        <Button type="submit" className="h-11" disabled={!normalized}>
          Išsaugoti
        </Button>
      </div>
    </form>
  );
}

function ConfirmButton({
  triggerLabel,
  triggerClassName,
  disabled,
  title,
  description,
  confirmLabel,
  onConfirm,
}: {
  triggerLabel: React.ReactNode;
  triggerClassName?: string;
  disabled?: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className={cn("h-11", triggerClassName)} disabled={disabled}>
          {triggerLabel}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="h-11">Atšaukti</AlertDialogCancel>
          <AlertDialogAction variant="destructive" className="h-11" onClick={onConfirm}>
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
