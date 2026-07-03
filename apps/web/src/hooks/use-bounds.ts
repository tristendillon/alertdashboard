import { useEffect, useState } from "react";
import { useMap } from "@vis.gl/react-google-maps";
import type { LatLngBounds } from "@/lib/types";

export function useBounds(mapId: string) {
  const [bounds, setBounds] = useState<LatLngBounds | null>(null);
  const map = useMap(mapId);

  useEffect(() => {
    if (!map) return;

    const updateBounds = () => {
      const mapBounds = map.getBounds();
      if (mapBounds) {
        setBounds(mapBounds.toJSON());
      }
    };

    updateBounds();
    map.addListener("bounds_changed", updateBounds);
  }, [map]);

  return bounds;
}
