"use client";

import { useCallback, useEffect, useState } from "react";

const ADMIN_STORAGE_KEY = "kasbus.admin";

/**
 * MVP "admin mode": opening /admin turns it on for this browser. It only toggles UI;
 * there is no authentication, matching the rest of the app.
 */
export function useAdminMode() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setIsAdmin(window.localStorage.getItem(ADMIN_STORAGE_KEY) === "1");
  }, []);

  const setAdmin = useCallback((value: boolean) => {
    if (value) window.localStorage.setItem(ADMIN_STORAGE_KEY, "1");
    else window.localStorage.removeItem(ADMIN_STORAGE_KEY);
    setIsAdmin(value);
  }, []);

  return { isAdmin, setAdmin };
}

export function AdminModeMarker() {
  const { setAdmin } = useAdminMode();
  useEffect(() => setAdmin(true), [setAdmin]);
  return null;
}
