"use client";

import { useEffect, useRef } from "react";
import { getLatLngDistances } from "@/utils/lat-lng";
import { env } from "@/env";
import type { DispatchWithType } from "@sizeupdashboard/convex/src/api/schema.ts";
import { useMap } from "@vis.gl/react-google-maps";
import type { LatLng } from "@/lib/types";

const containerStyle = {
  width: "100%",
  height: "300px",
};

interface StreetViewProps {
  dispatch: DispatchWithType;
}

type GeocodeResponse = {
  status: string;
  results: {
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
  }[];
};

/**
 * Attempts to geocode the provided address, with fallback to alert coordinates
 */
const fetchGeocode = async (
  fullAddress: string,
  dispatch: DispatchWithType,
) => {
  const alertCoords = dispatch.location as LatLng;
  const encoded = encodeURIComponent(fullAddress);

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encoded}&key=${env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`,
    );
    const data = (await response.json()) as GeocodeResponse;

    if (data.status === "OK" && data.results.length > 0) {
      if (!data.results[0]) {
        return alertCoords;
      }
      const { lat, lng } = data.results[0].geometry.location;
      const resultCoords = new google.maps.LatLng(lat, lng);
      const distance = getLatLngDistances(alertCoords, resultCoords.toJSON());
      return distance <= 100 ? resultCoords.toJSON() : alertCoords;
    }
  } catch (error) {
    console.error("Error in geocoding:", error);
  }

  return alertCoords;
};

const findNearbyPanorama = async (target: LatLng) => {
  const streetViewService = new google.maps.StreetViewService();
  let radius = 15;
  const maxRadius = 100;

  while (radius <= maxRadius) {
    try {
      const result = await streetViewService.getPanorama({
        radius,
        location: target,
        preference: google.maps.StreetViewPreference.BEST,
        sources: [
          google.maps.StreetViewSource.OUTDOOR,
          google.maps.StreetViewSource.GOOGLE,
        ],
      });
      return result;
    } catch {
      radius += 10;
    }
  }

  console.error("No panorama found");
  return null;
};

const StreetView: React.FC<StreetViewProps> = ({ dispatch }) => {
  const streetViewRef = useRef<HTMLDivElement | null>(null);
  const panoramaRef = useRef<google.maps.StreetViewPanorama | null>(null);
  const map = useMap("alert-popover-map");

  useEffect(() => {
    const initStreetView = async () => {
      if (!streetViewRef.current) return;

      const fullAddress = `${dispatch.address}, ${dispatch.city}, ${dispatch.stateCode}`;
      const target = dispatch.location as LatLng;

      try {
        const facingCoords = await fetchGeocode(fullAddress, dispatch);
        const panoResult = await findNearbyPanorama(target);
        if (!panoResult) return;
        const panoLatLng = panoResult.data.location?.latLng;

        if (!panoLatLng) return;

        const panorama = new google.maps.StreetViewPanorama(
          streetViewRef.current,
          {
            pano: panoResult.data.location?.pano,
            panControl: false,
            zoomControl: false,
            addressControl: false,
            linksControl: false,
            enableCloseButton: false,
            fullscreenControl: false,
            motionTracking: false,
            motionTrackingControl: false,
            scrollwheel: false,
            zoom: 0,
          },
        );

        panoramaRef.current = panorama;

        new google.maps.Marker({
          position: target,
          map: panorama,
          icon: {
            url: dispatch.icon ?? "",
            scaledSize: new google.maps.Size(40, 40),
          },
        });

        const initialHeading = google.maps.geometry.spherical.computeHeading(
          panoLatLng,
          facingCoords,
        );
        panorama.setPano(panoResult.data.location?.pano ?? "");

        setTimeout(() => {
          panorama.setPov({
            heading: initialHeading,
            pitch: -10,
          });
        }, 100);
      } catch (error) {
        console.error("Error initializing Street View:", error);
      }
    };

    void initStreetView();
  }, [dispatch, map]);

  return (
    <div className="relative">
      <div ref={streetViewRef} style={{ ...containerStyle }} />
    </div>
  );
};

export default StreetView;
