"use client";

import { AdvancedMarker } from "@vis.gl/react-google-maps";
import { Move } from "lucide-react";
import type {
  DispatchWithType,
  TransformedDispatch,
} from "@sizeupdashboard/convex/src/api/schema.ts";
import { GoogleMap } from "@/components/maps/google-map";
import IncidentMarker from "@/components/maps/incident-marker";

interface RealPreviewMapProps {
  original: DispatchWithType;
  transformed: TransformedDispatch;
  meters: number;
}

export function RealPreviewMap({
  original,
  transformed,
  meters,
}: RealPreviewMapProps) {
  const dest = transformed.location;
  const moved =
    dest !== undefined &&
    (dest.lat !== original.location.lat || dest.lng !== original.location.lng);

  return (
    <div className="relative min-h-[220px] w-full flex-1 overflow-hidden rounded-lg border">
      {/* Absolutely positioned: percentage heights can't resolve against the
          frame's min-height, so h-full alone collapses the map to 0px. */}
      <GoogleMap
        center={original.location}
        zoom={15}
        mapType="roadmap"
        className="absolute inset-0"
        mapClassName="h-full w-full"
      >
        {dest ? <IncidentMarker dispatch={transformed} /> : null}
        {moved ? (
          <AdvancedMarker position={original.location}>
            <div className="border-muted-foreground bg-muted-foreground/60 size-3 rounded-full border-2" />
          </AdvancedMarker>
        ) : null}
      </GoogleMap>
      {moved && meters > 0 ? (
        <div className="bg-card pointer-events-none absolute bottom-2 left-1/2 z-10 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10.5px] font-semibold whitespace-nowrap shadow-sm">
          <Move className="size-3 text-blue-500" />
          pin lands anywhere within ~{meters} m
        </div>
      ) : null}
    </div>
  );
}
