"use client";

import React, { createContext, useContext } from "react";
import { useDispatchAnalytics } from "@/hooks/use-dispatch-analytics";
import type { DispatchWithType } from "@sizeupdashboard/convex/src/api/schema.js";

// Mock data for view tokens - eventually this should come from an API
const mockViewTokens = [
  { name: "Fire Station 1", lastPing: Date.now() - 1000 * 30, isActive: true },
  { name: "Fire Station 2", lastPing: Date.now() - 1000 * 45, isActive: true },
  { name: "Police Station", lastPing: Date.now() - 1000 * 120, isActive: true },
  { name: "EMS Station", lastPing: Date.now() - 1000 * 60, isActive: true },
  { name: "Emergency Ops", lastPing: Date.now() - 1000 * 90, isActive: true },
  { name: "City Hall", lastPing: Date.now() - 1000 * 600, isActive: false },
  {
    name: "Training Center",
    lastPing: Date.now() - 1000 * 300,
    isActive: false,
  },
  { name: "Mobile Unit 1", lastPing: Date.now() - 1000 * 20, isActive: true },
];

interface DashboardData {
  dispatches: DispatchWithType[];
  totalDispatches: number;
  todaysDispatches: number;
  counts: Record<string, number>;
  hours: { hour: number; count: number }[];
  viewTokens: typeof mockViewTokens;
  activeViewTokens: number;
  totalViewTokens: number;
}

type DashboardContextType =
  | {
      loading: true;
      data: null;
    }
  | {
      loading: false;
      data: DashboardData;
    };

const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined,
);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const {
    counts,
    dispatches,
    loading,
    totalDispatches,
    todaysDispatches,
    hours,
  } = useDispatchAnalytics();

  const activeViewTokens = mockViewTokens.filter(
    (token) => token.isActive,
  ).length;
  const totalViewTokens = mockViewTokens.length;

  const data: DashboardData = {
    dispatches: dispatches!,
    totalDispatches: totalDispatches!,
    todaysDispatches: todaysDispatches!,
    counts: counts!,
    hours: hours!,
    viewTokens: mockViewTokens,
    activeViewTokens: activeViewTokens,
    totalViewTokens: totalViewTokens,
  };
  const value = {
    loading,
    data,
  } as DashboardContextType;

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}
