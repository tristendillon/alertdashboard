"use client";

import { api } from "@sizeupdashboard/convex/src/api/_generated/api.js";
import React, { useEffect } from "react";
import { Marker } from "@vis.gl/react-google-maps";
import { useBounds } from "@/hooks/use-bounds";
import type { LatLngBounds } from "@/lib/types";
import { getFlowRateColor } from "@/utils/icons";
import { usePaginatedQuery } from "convex/react";

interface HydrantsRendererProps {
  mapId: string;
}

export function HydrantsRenderer({ mapId }: HydrantsRendererProps) {
  const mapBounds = useBounds(mapId);

  if (!mapBounds) {
    return null;
  }

  return <Hydrants {...mapBounds} />;
}

const Hydrants = (bounds: LatLngBounds) => {
  const { status, results, loadMore } = usePaginatedQuery(
    api.hydrants.getHydrantsByBounds,
    {
      topLeft: {
        latitude: bounds.north,
        longitude: bounds.east,
      },
      bottomRight: {
        latitude: bounds.south,
        longitude: bounds.west,
      },
    },
    {
      initialNumItems: 100,
    },
  );

  useEffect(() => {
    if (status === "CanLoadMore") {
      void loadMore(100);
    }
  }, [status, loadMore]);

  if (status === "LoadingFirstPage" || status === "LoadingMore") {
    return null;
  }

  const hydrantsWithIcons = results.map((hydrant) => ({
    ...hydrant,
    icon: `icons/hydrants/hydrant-${getFlowRateColor(Number(hydrant.calculatedFlowRate))}.png`,
  }));
  return (
    <React.Fragment>
      {hydrantsWithIcons.map((hydrant) => (
        <Marker
          key={hydrant._id}
          position={{
            lat: hydrant.location.latitude,
            lng: hydrant.location.longitude,
          }}
          icon={{
            url: hydrant.icon,
            scaledSize: new google.maps.Size(40, 40),
          }}
        />
      ))}
    </React.Fragment>
  );
};
