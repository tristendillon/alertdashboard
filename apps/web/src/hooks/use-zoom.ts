import { useEffect, useState } from "react";
import { useMap } from "@vis.gl/react-google-maps";

export function useZoom(mapId: string) {
  const [zoom, setZoom] = useState<number | null>(null);
  const map = useMap(mapId);

  useEffect(() => {
    if (!map) return;

    const updateZoom = () => {
      const zoom = map.getZoom();
      if (zoom) {
        setZoom(zoom);
      }
    };

    updateZoom();
    map.addListener("zoom_changed", updateZoom);
  }, [map]);

  return zoom;
}
