"use client";

import { Pie, PieChart } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useDashboard } from "@/providers/dashboard-provider";

const chartConfig = {
  count: {
    label: "Dispatches",
  },
  fire: {
    label: "Fire",
    color: "var(--chart-1)",
  },
  medical: {
    label: "Medical",
    color: "var(--chart-2)",
  },
  mva: {
    label: "MVA",
    color: "var(--chart-3)",
  },
  rescue: {
    label: "Rescue",
    color: "var(--chart-4)",
  },
  law: {
    label: "Law",
    color: "var(--chart-5)",
  },
  other: {
    label: "Other",
    color: "var(--chart-6)",
  },
  aircraft: {
    label: "Aircraft",
    color: "var(--chart-7)",
  },
  hazmat: {
    label: "Hazmat",
    color: "var(--chart-8)",
  },
  marine: {
    label: "Marine",
    color: "var(--chart-9)",
  },
} satisfies ChartConfig;

export function DispatchPieChart() {
  const { data, loading } = useDashboard();
  // Transform data to include colors using chart config

  if (loading) {
    return (
      <div className="flex flex-col">
        <div className="flex-1 pb-0">
          <div className="mx-auto flex aspect-square max-h-[250px] items-center justify-center pb-0">
            <Skeleton className="h-[200px] w-[200px] rounded-full" />
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-3 w-3 rounded-full" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        </div>
        <div className="flex-col gap-2 pt-4 text-sm">
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    );
  }

  const chartData = Object.entries(data.counts)
    .filter(([, count]) => count > 0)
    .map(([group, count]) => ({
      group,
      count,
      fill: `var(--color-${group})`,
      percentage: ((count / data.totalDispatches) * 100).toFixed(2),
    }));

  return (
    <ChartContainer
      config={chartConfig}
      className="[&_.recharts-pie-label-text]:fill-foreground mx-auto aspect-square max-h-[250px] pb-0"
    >
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        <Pie data={chartData} dataKey="count" nameKey="group" />
        <ChartLegend
          content={<ChartLegendContent nameKey="group" />}
          className="-translate-y-2 flex-wrap gap-2 *:basis-1/4 *:justify-center"
        />
      </PieChart>
    </ChartContainer>
  );
}
