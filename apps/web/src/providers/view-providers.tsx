"use client";

import { createContext, useContext, useEffect } from "react";
import { useMutation } from "convex/react";
import type { Id } from "@sizeupdashboard/convex/src/api/_generated/dataModel.js";
import { api } from "@sizeupdashboard/convex/src/api/_generated/api.js";
import { useClientId } from "@/hooks/use-client-id";

type ViewToken = {
  tokenId?: Id<"viewTokens">;
};

export const ViewTokenContext = createContext<ViewToken | null>(null);

const HEARTBEAT_MS = 30_000;

interface ViewTokenProviderProps {
  children: React.ReactNode;
  tokenId?: Id<"viewTokens">;
}

export const ViewTokenProvider = ({
  children,
  tokenId,
}: ViewTokenProviderProps) => {
  useViewTokenPresence(tokenId);

  return (
    <ViewTokenContext.Provider
      value={{
        tokenId,
      }}
    >
      {children}
    </ViewTokenContext.Provider>
  );
};

/**
 * Heartbeat that reports this tab's presence for the current view token:
 * on mount, every 30s, and whenever the tab becomes visible again. The
 * backend marks a client offline after 90s of silence (see Convex
 * ONLINE_WINDOW_MS / the cleanup cron).
 */
function useViewTokenPresence(tokenId?: Id<"viewTokens">) {
  const clientId = useClientId();
  // useMutation returns a referentially stable callback, so listing it in deps
  // does not re-arm the interval.
  const ping = useMutation(api.viewToken.pingViewToken);

  useEffect(() => {
    if (!tokenId || !clientId) return;

    const sendPing = () => {
      void ping({ viewToken: tokenId, clientId }).catch(() => {
        // Presence is best-effort; ignore transient failures.
      });
    };

    sendPing();
    const interval = setInterval(sendPing, HEARTBEAT_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") sendPing();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [tokenId, clientId, ping]);
}

export function useViewToken() {
  const context = useContext(ViewTokenContext);
  if (!context) {
    throw new Error("useViewToken must be used within a ViewTokenProvider");
  }
  return context;
}
