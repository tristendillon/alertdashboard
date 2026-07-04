"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "vt-client-id";

/**
 * A stable per-tab client id (sessionStorage), created on first use. Two tabs
 * in the same browser get distinct ids, so presence counts distinct screens.
 *
 * Returns `undefined` until mounted so SSR and the first client render match
 * (sessionStorage is unavailable on the server).
 */
export function useClientId(): string | undefined {
  const [clientId, setClientId] = useState<string | undefined>(undefined);

  useEffect(() => {
    let id = sessionStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(STORAGE_KEY, id);
    }
    setClientId(id);
  }, []);

  return clientId;
}
