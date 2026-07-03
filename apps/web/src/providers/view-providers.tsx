"use client";

import { createContext, useContext } from "react";
import type { Id } from "@sizeupdashboard/convex/src/api/_generated/dataModel.js";

type ViewToken = {
  tokenId?: Id<"viewTokens">;
};

export const ViewTokenContext = createContext<ViewToken | null>(null);

interface ViewTokenProviderProps {
  children: React.ReactNode;
  tokenId?: Id<"viewTokens">;
}

export const ViewTokenProvider = ({
  children,
  tokenId,
}: ViewTokenProviderProps) => {
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

export function useViewToken() {
  const context = useContext(ViewTokenContext);
  if (!context) {
    throw new Error("useViewToken must be used within a ViewTokenProvider");
  }
  return context;
}
