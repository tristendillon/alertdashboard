import { useDispatches } from "@/providers/dispatches-provider";
import { useMemo } from "react";
import { ClusteredDispatchMarkers } from "@/components/maps/clustered-dispatch-markers";
import type { DispatchWithType } from "@sizeupdashboard/convex/src/api/schema.ts";

const ICON_GROUPS = [
  "fire",
  "medical",
  "mva",
  "aircraft",
  "law",
  "rescue",
  "marine",
] as const;
const ALL_GROUPS = [...ICON_GROUPS, "other"] as const;

// The groups we render clusterers for — a subset of DispatchGroupEnum
// (e.g. hazmat has no icon bucket and folds into "other").
type RenderGroup = (typeof ALL_GROUPS)[number];

function groupOfDispatch(dispatch: DispatchWithType): RenderGroup {
  return ICON_GROUPS.find((g) => dispatch.icon?.includes(g)) ?? "other";
}

export function IncidentMarkersRenderer() {
  const { dispatches } = useDispatches();

  const dispatchesByGroup = useMemo(() => {
    const byGroup: Record<RenderGroup, DispatchWithType[]> = {
      fire: [],
      medical: [],
      mva: [],
      aircraft: [],
      law: [],
      rescue: [],
      marine: [],
      other: [],
    };
    for (const dispatch of dispatches) {
      byGroup[groupOfDispatch(dispatch)].push(dispatch);
    }
    return byGroup;
  }, [dispatches]);

  return ALL_GROUPS.map((group) => (
    <ClusteredDispatchMarkers
      key={group}
      group={group}
      dispatches={dispatchesByGroup[group]}
    />
  ));
}
