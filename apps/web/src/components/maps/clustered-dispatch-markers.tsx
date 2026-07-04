"use client";

import {
  MarkerClusterer,
  SuperClusterAlgorithm,
} from "@googlemaps/markerclusterer";
import { useMap } from "@vis.gl/react-google-maps";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NORMAL_MAP_ID } from "@/components/view-map";
import NoiseMarker from "@/components/maps/noise-marker";
import type {
  DispatchGroupEnum,
  DispatchWithType,
} from "@sizeupdashboard/convex/src/api/schema.ts";

interface ClusteredDispatchMarkersProps {
  group: DispatchGroupEnum;
  dispatches: DispatchWithType[];
}

const CLUSTER_Z_INDEX = 10000;

type MarkerRefCallback = (
  marker: google.maps.marker.AdvancedMarkerElement | null,
) => void;

// The clusterer's renderer is imperative — it needs a plain DOM element, not
// JSX. Mirrors the old ClusterMarker look: 40x40 group icon + count badge.
function buildClusterContent(
  iconSrc: string,
  group: string,
  count: number,
): HTMLElement {
  const root = document.createElement("div");
  root.className = "relative cursor-pointer";

  const img = document.createElement("img");
  img.src = iconSrc;
  img.alt = group;
  img.width = 40;
  img.height = 40;

  const badge = document.createElement("span");
  badge.className =
    "absolute -top-2 -right-2 inline-flex items-center justify-center rounded-full border border-transparent bg-primary text-primary-foreground px-2 py-0.5 text-xs font-medium whitespace-nowrap";
  badge.textContent = String(count);

  root.append(img, badge);
  return root;
}

export function ClusteredDispatchMarkers({
  group,
  dispatches,
}: ClusteredDispatchMarkersProps) {
  const map = useMap(NORMAL_MAP_ID);

  // The renderer reads the icon through a ref (updated in an effect) so icon
  // changes never recreate the clusterer.
  const fallbackIcon = `/icons/incidents/${group}.png`;
  const iconRef = useRef(fallbackIcon);
  useEffect(() => {
    iconRef.current = dispatches[0]?.icon ?? fallbackIcon;
  });

  const renderClusterMarker = useCallback(
    ({ count, position }: { count: number; position: google.maps.LatLng }) =>
      new google.maps.marker.AdvancedMarkerElement({
        position,
        zIndex: CLUSTER_Z_INDEX,
        content: buildClusterContent(iconRef.current, group, count),
      }),
    [group],
  );

  // Created in an effect, not useMemo: the constructor attaches to the map,
  // a side effect that would leak a duplicate clusterer under StrictMode.
  const clustererRef = useRef<MarkerClusterer | null>(null);
  useEffect(() => {
    if (!map) return;
    const clusterer = new MarkerClusterer({
      map,
      algorithm: new SuperClusterAlgorithm({ radius: 100, maxZoom: 18 }),
      renderer: { render: renderClusterMarker },
      // No onClusterClick: the default handler zooms to the cluster bounds.
    });
    clustererRef.current = clusterer;
    return () => {
      clustererRef.current = null;
      clusterer.clearMarkers();
      clusterer.setMap(null);
    };
  }, [map, renderClusterMarker]);

  const [markers, setMarkers] = useState<
    Record<string, google.maps.marker.AdvancedMarkerElement>
  >({});

  const setMarkerRef = useCallback(
    (marker: google.maps.marker.AdvancedMarkerElement | null, key: string) => {
      setMarkers((prev) => {
        if (marker) {
          if (prev[key] === marker) return prev;
          return { ...prev, [key]: marker };
        }
        if (!(key in prev)) return prev;
        const rest = { ...prev };
        delete rest[key];
        return rest;
      });
    },
    [],
  );

  // Per-dispatch ref callbacks memoized on the id list: a fresh arrow per
  // render would make React fire null/instance ref cycles on every data tick
  // and churn the clusterer.
  const idsKey = dispatches.map((dispatch) => dispatch._id).join("\n");
  const markerRefs = useMemo(() => {
    const refs = new Map<string, MarkerRefCallback>();
    if (!idsKey) return refs;
    for (const id of idsKey.split("\n")) {
      refs.set(id, (marker) => {
        setMarkerRef(marker, id);
      });
    }
    return refs;
  }, [idsKey, setMarkerRef]);

  // Also keyed on [map, renderClusterMarker] so it re-runs after the effect
  // above recreates the clusterer.
  useEffect(() => {
    const clusterer = clustererRef.current;
    if (!clusterer) return;
    clusterer.clearMarkers();
    clusterer.addMarkers(Object.values(markers));
  }, [markers, map, renderClusterMarker]);

  return dispatches.map((dispatch) => (
    <NoiseMarker
      key={dispatch._id}
      dispatch={dispatch}
      markerRef={markerRefs.get(dispatch._id)}
    />
  ));
}
