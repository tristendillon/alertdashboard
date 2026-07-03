import { env } from "@/env";
import type { LatLng } from "@/lib/types";
import { APIProvider, Map } from "@vis.gl/react-google-maps";

// Define map types
export type MapType = "roadmap" | "satellite" | "hybrid" | "terrain";

interface GoogleMapProps extends React.HTMLAttributes<HTMLDivElement> {
  ref?: React.RefObject<HTMLDivElement | null>;
  center: LatLng;
  zoom?: number;
  mapClassName?: string;
  mapType?: MapType;
  disableMovement?: boolean;
}

export function GoogleMap({
  id,
  center,
  zoom = 10,
  children,
  className,
  mapClassName,
  mapType = "roadmap",
  ref,
  disableMovement = false,
  ...props
}: GoogleMapProps) {
  const apiKey = env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error("Google Maps API key is not set");
  }

  return (
    <div ref={ref} className={className} {...props}>
      <APIProvider apiKey={apiKey}>
        <Map
          mapId={env.NEXT_PUBLIC_MAP_ID}
          id={id}
          className={mapClassName}
          defaultCenter={center}
          defaultZoom={zoom}
          mapTypeId={mapType}
          style={{ width: "100%", height: "400px" }}
          gestureHandling={disableMovement ? "none" : "greedy"}
          disableDefaultUI={true}
          mapTypeControl={false}
          tilt={0}
          heading={0}
          zoomControl={false}
          scrollwheel={!disableMovement}
          disableDoubleClickZoom={disableMovement}
          keyboardShortcuts={!disableMovement}
        >
          {children}
        </Map>
      </APIProvider>
    </div>
  );
}
