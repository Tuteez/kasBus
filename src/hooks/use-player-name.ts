"use client";

import { useCallback, useEffect, useState } from "react";

const NAME_STORAGE_KEY = "kasbus.playerName";

/** Player name persisted in localStorage; `loaded` is false until read on the client. */
export function usePlayerName() {
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setPlayerName(window.localStorage.getItem(NAME_STORAGE_KEY));
    setLoaded(true);
  }, []);

  const savePlayerName = useCallback((name: string) => {
    window.localStorage.setItem(NAME_STORAGE_KEY, name);
    setPlayerName(name);
  }, []);

  return { playerName, loaded, savePlayerName };
}
