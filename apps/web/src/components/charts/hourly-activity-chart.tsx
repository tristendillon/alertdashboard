"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import { Skeleton } from "@/components/ui/skeleton";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useDashboard } from "@/providers/dashboard-provider";

const chartConfig = {
  dispatches: {
    label: "Dispatches",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

const randomHeights = [
  80, 65, 100, 55, 90, 110, 70, 95, 60, 85, 120, 75, 105, 50, 115, 68, 98, 88,
  78, 108, 58, 112, 72, 102,
];

export function HourlyActivityChart() {
  const { data, loading } = useDashboard();

  if (loading) {
    return (
      <div className="flex aspect-auto h-[300px] w-full flex-col justify-end">
        <div className="flex h-full items-end justify-between px-4 pb-8">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <Skeleton
                className="w-6 rounded-sm"
                style={{ height: `${randomHeights[i]}px` }}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const chartData = data.hours.map((item) => ({
    hour: item.hour,
    dispatches: item.count,
  }));

  return (
    <ChartContainer
      config={chartConfig}
      className="aspect-auto h-[300px] w-full"
    >
      <BarChart
        accessibilityLayer
        data={chartData}
        margin={{
          left: 12,
          right: 12,
        }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="hour"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(hour) => `${hour.toString().padStart(2, "0")}:00`}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              className="w-[150px]"
              nameKey="dispatches"
              labelFormatter={(value: string, payload) => {
                const data = payload[0]?.payload;
                if (!data) return value;
                const hour = data?.hour;
                const timeRange = `${hour.toString().padStart(2, "0")}:00 - ${((hour + 1) % 24).toString().padStart(2, "0")}:00`;
                return timeRange;
              }}
            />
          }
        />
        <Bar dataKey="dispatches" fill="var(--color-dispatches)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
