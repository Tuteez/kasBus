"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { normalizePlayerName } from "@/lib/attendance";

export const PLAYER_NAME_INPUT_ID = "playerName";

export function NameForm({
  initialName = "",
  onSubmit,
  onCancel,
  autoFocus = true,
}: {
  initialName?: string;
  onSubmit: (name: string) => void;
  onCancel?: () => void;
  autoFocus?: boolean;
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
      <Label htmlFor={PLAYER_NAME_INPUT_ID} className="text-lg font-semibold">
        Įveskite savo vardą
      </Label>
      <Input
        id={PLAYER_NAME_INPUT_ID}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        maxLength={40}
        autoComplete="given-name"
        autoCapitalize="words"
        autoFocus={autoFocus}
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
