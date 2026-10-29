"use client";

import { useEffect, useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setAttendanceAction } from "@/app/actions";
import {
  normalizePlayerName,
  playerKey,
  playersGenitive,
  summarizeAttendance,
} from "@/lib/attendance";
import { STATUS_STYLES } from "@/lib/status";
import type { Attendance, AttendanceResponse } from "@/lib/types";
import { cn } from "@/lib/utils";

const NAME_STORAGE_KEY = "kasbus.playerName";
const REFRESH_INTERVAL_MS = 10_000;

const RESPONSE_BUTTONS: { value: AttendanceResponse; label: string; active: string }[] = [
  { value: "YES", label: "✅ Dalyvausiu", active: "bg-green-600 text-white border-green-600 hover:bg-green-600/90" },
  { value: "MAYBE", label: "❓ Galbūt", active: "bg-amber-500 text-white border-amber-500 hover:bg-amber-500/90" },
  { value: "NO", label: "❌ Nedalyvausiu", active: "bg-red-600 text-white border-red-600 hover:bg-red-600/90" },
];

type OptimisticUpdate = { playerName: string; response: AttendanceResponse };

export function AttendancePanel({
  eventId,
  minimumPlayers,
  attendance,
  knownPlayers,
}: {
  eventId: string;
  minimumPlayers: number;
  attendance: Attendance[];
  knownPlayers: string[];
}) {
  const router = useRouter();
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [nameLoaded, setNameLoaded] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [optimisticAttendance, applyOptimistic] = useOptimistic(
    attendance,
    (current: Attendance[], update: OptimisticUpdate): Attendance[] => {
      const key = playerKey(update.playerName);
      const others = current.filter((a) => playerKey(a.playerName) !== key);
      return [
        ...others,
        {
          id: `optimistic-${key}`,
          eventId,
          playerName: update.playerName,
          response: update.response,
          updatedAt: new Date().toISOString(),
        },
      ];
    },
  );

  useEffect(() => {
    const stored = window.localStorage.getItem(NAME_STORAGE_KEY);
    if (stored) setPlayerName(stored);
    setNameLoaded(true);
  }, []);

  // Poll so everyone sees other players' responses without reloading.
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const timer = window.setInterval(refresh, REFRESH_INTERVAL_MS);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [router]);

  const summary = summarizeAttendance(optimisticAttendance, knownPlayers, minimumPlayers);
  const myKey = playerName ? playerKey(playerName) : null;
  const myResponse = optimisticAttendance.find((a) => playerKey(a.playerName) === myKey)?.response;

  function saveName(name: string) {
    window.localStorage.setItem(NAME_STORAGE_KEY, name);
    setPlayerName(name);
    setEditingName(false);
  }

  function respond(response: AttendanceResponse) {
    if (!playerName) return;
    setError(null);
    startTransition(async () => {
      applyOptimistic({ playerName, response });
      const result = await setAttendanceAction(eventId, playerName, response);
      if (result.error) setError(result.error);
    });
  }

  const status = STATUS_STYLES[summary.status];

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

      <div className={cn("rounded-xl border px-4 py-4 text-center", status.banner)} aria-live="polite">
        <p className="text-xl font-bold">{status.label}</p>
        {summary.status === "SHORT" && (
          <p className="mt-1 text-base">
            Trūksta dar {summary.missingPlayers} {playersGenitive(summary.missingPlayers)}
          </p>
        )}
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
    </div>
  );
}

function NameForm({
  initialName,
  onSubmit,
  onCancel,
}: {
  initialName: string;
  onSubmit: (name: string) => void;
  onCancel?: () => void;
}) {
  const [value, setValue] = useState(initialName);
  const name = normalizePlayerName(value);

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (name) onSubmit(name);
      }}
    >
      <Label htmlFor="playerName" className="text-lg font-semibold">
        Įveskite savo vardą
      </Label>
      <Input
        id="playerName"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        maxLength={40}
        autoComplete="given-name"
        autoCapitalize="words"
        autoFocus
        placeholder="Pvz., Maksim"
        className="h-14 text-lg"
      />
      <Button type="submit" disabled={!name} className="h-14 text-lg">
        Patvirtinti
      </Button>
      {onCancel && (
        <Button type="button" variant="ghost" className="h-12 text-base" onClick={onCancel}>
          Atšaukti
        </Button>
      )}
    </form>
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
