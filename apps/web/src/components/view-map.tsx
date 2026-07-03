"use client";

import { MapPin } from "lucide-react";
import { useActiveDispatch } from "@/providers/active-dispatch-provider";
import { GoogleMap } from "@/components/maps/google-map";
import { HydrantsRenderer } from "@/components/alert-popover/hydrants-renderer";
import type { DispatchWithType } from "@sizeupdashboard/convex/src/api/schema.ts";
import IncidentMarker from "@/components/maps/incident-marker";
import StreetView from "@/components/alert-popover/street-view";
import { useDispatches } from "@/providers/dispatches-provider";
import { getCenterOfLatLngs } from "@/utils/lat-lng";
import { useRef } from "react";
import { IncidentMarkersRenderer } from "@/components/maps/dispatch-marker-renderer";
import { ConditionalWrapper } from "@/components/ui/conditional-wrapper";
import { RenderWeatherAlerts } from "@/components/ui/render-weather-alerts";

export const NORMAL_MAP_ID = "home-map";
export const POPOVER_MAP_ID = "popover-map";
const POPOVER_MAP_ZOOM = 18;

export function ViewMap() {
  const { dispatch } = useActiveDispatch();
  return (
    <div className="relative flex h-full items-center justify-center md:flex-1">
      <ConditionalWrapper
        condition={dispatch}
        wrapper={(children, dispatch) => (
          <PopoverMap
            dispatch={dispatch}
            className="absolute inset-0 z-30 flex h-full w-full items-center justify-center"
            mapClassName="w-full h-full"
          >
            {children}
          </PopoverMap>
        )}
        elseWrapper={(children) => (
          <NormalMap
            className="relative flex h-full w-full items-center justify-center"
            mapClassName="w-full h-full"
          >
            {children}
          </NormalMap>
        )}
      >
        <RenderWeatherAlerts />
        {/* {weatherAlerts.length > 0 && (
            <article className="absolute bottom-0 left-0 flex flex-row gap-1 p-1 md:flex-col lg:hidden">
              {weatherAlerts.map((alert, index) => (
                <WeatherAlert
                  key={index}
                  alert={alert}
                  className="inline-block p-2"
                >
                  <div className="flex items-center space-x-1">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-white"></span>
                    <WeatherAlertTitle className="text-sm font-medium" />
                  </div>
                </WeatherAlert>
              ))}
            </article>
          )} */}
      </ConditionalWrapper>
    </div>
  );
}

const MapLoadingState = () => {
  return (
    <div className="bg-muted/50 flex h-full w-full items-center justify-center">
      <div className="p-8 text-center">
        <div className="mb-6">
          <MapPin className="text-primary mx-auto h-16 w-16 animate-pulse" />
        </div>

        <h3 className="text-foreground mb-2 text-lg font-medium">
          Loading map...
        </h3>

        <p className="text-muted-foreground mb-6 text-sm">
          Please wait while we load your map data
        </p>

        <div className="flex justify-center space-x-1">
          <div
            className="bg-primary h-2 w-2 animate-bounce rounded-full"
            style={{ animationDelay: "0ms" }}
          />
          <div
            className="bg-primary h-2 w-2 animate-bounce rounded-full"
            style={{ animationDelay: "150ms" }}
          />
          <div
            className="bg-primary h-2 w-2 animate-bounce rounded-full"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    </div>
  );
};

interface NormalMapProps {
  className?: string;
  mapClassName?: string;
  children: React.ReactNode;
}

export function NormalMap({
  children,
  className,
  mapClassName,
}: NormalMapProps) {
  const { dispatches, status } = useDispatches();
  const mapRef = useRef<HTMLDivElement | null>(null);

  const latLngs = dispatches.map((d) => d.location);
  const center = getCenterOfLatLngs(latLngs);
  if (status === "LoadingFirstPage") {
    return <MapLoadingState />;
  }
  return (
    <GoogleMap
      ref={mapRef}
      id={NORMAL_MAP_ID}
      center={center}
      mapType="satellite"
      zoom={14}
      className={className}
      mapClassName={mapClassName}
    >
      {children}
      <IncidentMarkersRenderer />
    </GoogleMap>
  );
}

interface PopoverMapProps {
  dispatch: DispatchWithType;
  className?: string;
  mapClassName?: string;
  children: React.ReactNode;
}

export function PopoverMap({
  dispatch,
  children,
  className,
  mapClassName,
}: PopoverMapProps) {
  return (
    <GoogleMap
      id={POPOVER_MAP_ID}
      center={dispatch.location}
      mapType="satellite"
      zoom={POPOVER_MAP_ZOOM}
      className={className}
      mapClassName={mapClassName}
      disableMovement={true}
    >
      <IncidentMarker dispatch={dispatch} />
      <HydrantsRenderer mapId={POPOVER_MAP_ID} />
      <div className="absolute right-0 bottom-0 hidden h-[300px] w-[300px] md:block">
        <StreetView dispatch={dispatch} />
      </div>
      {children}
    </GoogleMap>
  );
}
