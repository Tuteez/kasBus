"use client";

import { useOptimistic, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AdminAttendanceManager } from "@/components/admin-attendance-manager";
import { NameForm } from "@/components/name-form";
import {
  clearAttendanceAction,
  deleteAttendanceEntryAction,
  setAttendanceAction,
  updateAttendanceEntryAction,
  type FormState,
} from "@/app/actions";
import { useAdminMode } from "@/hooks/use-admin-mode";
import { useAutoRefresh } from "@/hooks/use-auto-refresh";
import { usePlayerName } from "@/hooks/use-player-name";
import {
  applyAttendanceChange,
  findResponse,
  playerKey,
  calculateStatus,
  summarizeAttendance,
  type AttendanceChange,
} from "@/lib/attendance";
import { STATUS_STYLES } from "@/lib/status";
import type { Attendance, AttendanceResponse, EventType } from "@/lib/types";
import { cn } from "@/lib/utils";

const RESPONSE_BUTTONS: { value: AttendanceResponse; label: string; active: string }[] = [
  { value: "YES", label: "✅ Dalyvausiu", active: "bg-green-600 text-white border-green-600 hover:bg-green-600/90" },
  { value: "MAYBE", label: "❓ Galbūt", active: "bg-amber-500 text-white border-amber-500 hover:bg-amber-500/90" },
  { value: "NO", label: "❌ Nedalyvausiu", active: "bg-red-600 text-white border-red-600 hover:bg-red-600/90" },
];

export function AttendancePanel({
  eventId,
  eventType,
  attendance,
  knownPlayers,
}: {
  eventId: string;
  eventType: EventType;
  attendance: Attendance[];
  knownPlayers: string[];
}) {
  const { playerName, loaded: nameLoaded, savePlayerName } = usePlayerName();
  const { isAdmin, setAdmin } = useAdminMode();
  const [editingName, setEditingName] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [optimisticAttendance, applyOptimistic] = useOptimistic(
    attendance,
    (current: Attendance[], change: AttendanceChange) => applyAttendanceChange(current, eventId, change),
  );

  useAutoRefresh();

  const summary = summarizeAttendance(optimisticAttendance, knownPlayers);
  const myKey = playerName ? playerKey(playerName) : null;
  const myResponse = findResponse(optimisticAttendance, playerName);

  function saveName(name: string) {
    savePlayerName(name);
    setEditingName(false);
  }

  function respond(response: AttendanceResponse) {
    if (!playerName) return;
    setError(null);
    startTransition(async () => {
      applyOptimistic({ type: "set", playerName, response });
      const result = await setAttendanceAction(eventId, playerName, response);
      if (result.error) setError(result.error);
    });
  }

  function runAdmin(change: AttendanceChange, action: () => Promise<FormState>) {
    setAdminError(null);
    startTransition(async () => {
      applyOptimistic(change);
      const result = await action();
      if (result.error) setAdminError(result.error);
    });
  }

  const status = calculateStatus(eventType, summary.names.YES.length);

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardContent className="flex flex-col gap-4">
          {!nameLoaded ? (
            <div className="h-36" aria-busy="true" />
          ) : !playerName || editingName ? (
            <NameForm
              initialName={editingName ? (playerName ?? "") : ""}
              onSubmit={saveName}
              onCancel={editingName ? () => setEditingName(false) : undefined}
            />
          ) : (
            <>
              <div className="flex items-center justify-between gap-3">
                <p className="text-lg">
                  Sveiki, <span className="font-semibold">{playerName}</span>
                </p>
                <Button variant="link" className="h-10 px-0 text-base" onClick={() => setEditingName(true)}>
                  Keisti vardą
                </Button>
              </div>
              <div className="flex flex-col gap-3">
                {RESPONSE_BUTTONS.map((btn) => {
                  const selected = myResponse === btn.value;
                  return (
                    <Button
                      key={btn.value}
                      type="button"
                      variant="outline"
                      aria-pressed={selected}
                      disabled={pending && !selected}
                      onClick={() => respond(btn.value)}
                      className={cn("h-16 w-full rounded-xl text-lg font-semibold", selected && btn.active)}
                    >
                      {btn.label}
                    </Button>
                  );
                })}
              </div>
              {error && (
                <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <div className={cn("rounded-xl border px-4 py-4 text-center", STATUS_STYLES[status.tone].banner)} aria-live="polite">
        <p className="text-xl font-bold">{status.label}</p>
        {status.hint && <p className="mt-1 text-base">{status.hint}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <CountTile label="✅ Dalyvaus" count={summary.names.YES.length} />
        <CountTile label="❓ Galbūt" count={summary.names.MAYBE.length} />
        <CountTile label="❌ Nedalyvaus" count={summary.names.NO.length} />
        <CountTile label="⏳ Neatsakė" count={summary.noResponse.length} />
      </div>

      <Card>
        <CardContent className="flex flex-col gap-5">
          <NameList title="✅ Dalyvaus" names={summary.names.YES} myKey={myKey} />
          <NameList title="❓ Galbūt" names={summary.names.MAYBE} myKey={myKey} />
          <NameList title="❌ Nedalyvaus" names={summary.names.NO} myKey={myKey} />
          {summary.noResponse.length > 0 && (
            <NameList title="⏳ Neatsakė" names={summary.noResponse} myKey={myKey} muted />
          )}
        </CardContent>
      </Card>
      {isAdmin && (
        <>
          {adminError && (
            <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {adminError}
            </p>
          )}
          <AdminAttendanceManager
            attendance={optimisticAttendance}
            onEdit={(entry, name, response) =>
              runAdmin({ type: "edit", id: entry.id, playerName: name, response }, () =>
                updateAttendanceEntryAction(entry.id, eventId, name, response),
              )
            }
            onDelete={(entry) =>
              runAdmin({ type: "delete", id: entry.id }, () => deleteAttendanceEntryAction(entry.id, eventId))
            }
            onClear={() => runAdmin({ type: "clear" }, () => clearAttendanceAction(eventId))}
            onExitAdmin={() => setAdmin(false)}
          />
        </>
      )}
    </div>
  );
}

function CountTile({ label, count }: { label: string; count: number }) {
  return (
    <div className="rounded-xl border bg-card px-3 py-3">
      <p className="text-sm text-muted-foreground">{label}:</p>
      <p className="text-3xl font-bold tabular-nums">{count}</p>
    </div>
  );
}

function NameList({
  title,
  names,
  myKey,
  muted,
}: {
  title: string;
  names: string[];
  myKey: string | null;
  muted?: boolean;
}) {
  return (
    <section>
      <h3 className="mb-2 font-semibold">
        {title} <span className="font-normal text-muted-foreground">({names.length})</span>
      </h3>
      {names.length === 0 ? (
        <p className="text-sm text-muted-foreground">—</p>
      ) : (
        <ul className={cn("flex flex-col gap-1 pl-1", muted && "text-muted-foreground")}>
          {names.map((name) => (
            <li key={name} className="text-base">
              • {name}
              {playerKey(name) === myKey && <span className="text-muted-foreground"> (jūs)</span>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
