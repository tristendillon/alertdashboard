import { AdvancedMarker } from "@vis.gl/react-google-maps";
import { cn } from "@/utils/ui";
import Image from "next/image";
import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useActiveDispatch } from "@/providers/active-dispatch-provider";
import { useDispatches } from "@/providers/dispatches-provider";
import useDebounce from "@/hooks/use-debounce";
import { ApproximationWarning } from "@/components/ui/approximation-warning";
import type {
  DispatchGroupEnum,
  DispatchWithType,
} from "@sizeupdashboard/convex/src/api/schema.ts";
import { SquareArrowOutUpRight } from "lucide-react";

interface ClusterMarkerProps {
  location: {
    lat: number;
    lng: number;
  };
  group: DispatchGroupEnum;
  dispatches: DispatchWithType[];
  children?: React.ReactNode;
  className?: string;
}

interface DispatchCardProps {
  dispatch: DispatchWithType;
  className?: string;
  closePopover: () => void;
}

function DispatchCard({
  dispatch,
  className,
  closePopover,
}: DispatchCardProps) {
  const { activateDispatch } = useActiveDispatch();

  const handleClick = () => {
    closePopover();
    activateDispatch(dispatch);
  };

  return (
    <div
      className={cn(
        "bg-muted border-border hover:bg-muted/80 relative cursor-pointer rounded-md border p-3 text-sm",
        className,
      )}
      onClick={handleClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Image
            src={dispatch.icon ?? ""}
            alt={dispatch.dispatchType?.group ?? dispatch.type}
            width={16}
            height={16}
            className="flex-shrink-0"
          />
          <span className="font-medium capitalize">{dispatch.type}</span>
        </div>
      </div>
      <p className="text-muted-foreground mt-2 text-xs">
        Dispatch ID: {dispatch.dispatchId}
      </p>

      <SquareArrowOutUpRight className="absolute top-2 right-2 h-3 w-3" />
    </div>
  );
}

export default function ClusterMarker({
  location,
  group,
  dispatches,
  children,
  className,
}: ClusterMarkerProps) {
  const [isOpen, _setIsOpen] = useState(false);
  const setIsOpen = useDebounce(_setIsOpen, 100);
  const { getDispatchesInRadius } = useDispatches();
  const [similarDispatches, setSimilarDispatches] = useState<
    DispatchWithType[]
  >([]);

  const handleMarkerClick = () => {
    setIsOpen((prev) => !prev);
    // Get similar dispatches and exclude the current dispatch
    const simDispatches = getDispatchesInRadius(location, 10);
    const ids = dispatches.map((d) => d.dispatchId);
    const uniqueDispatches = simDispatches.filter(
      (d) => !ids.includes(d.dispatchId),
    );
    setSimilarDispatches(uniqueDispatches);
  };

  return (
    <Popover
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
      }}
    >
      <PopoverTrigger asChild>
        <AdvancedMarker
          zIndex={10000}
          onClick={handleMarkerClick}
          className={cn("relative cursor-pointer", className)}
          position={location}
        >
          <Image
            src={dispatches[0].icon ?? ""}
            alt={group}
            width={40}
            height={40}
          />
          {children}
        </AdvancedMarker>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-4">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Image
              src={dispatches[0].icon ?? ""}
              alt={group}
              width={24}
              height={24}
            />
            <h3 className="text-lg font-semibold capitalize">
              {group} Cluster
            </h3>
          </div>

          {/* Approximation warning */}
          <ApproximationWarning
            dispatchGroup={group as string}
            variant="compact"
          />

          <div className="text-muted-foreground text-sm">
            <p>Contains {dispatches.length} incidents</p>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">
              Incidents in Cluster ({dispatches.length}):
            </h4>
            <div className="max-h-48 space-y-2 overflow-y-auto pr-2">
              {dispatches.map((dispatch, index) => (
                <DispatchCard
                  key={dispatch.dispatchId || index}
                  dispatch={dispatch}
                  closePopover={() => setIsOpen(false)}
                />
              ))}
            </div>
          </div>
          {similarDispatches.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">
                Similar Incidents ({similarDispatches.length}):
              </h4>
              <div className="max-h-48 space-y-2 overflow-y-auto pr-2">
                {similarDispatches.map((similarDispatch, index) => (
                  <DispatchCard
                    key={similarDispatch.dispatchId || index}
                    dispatch={similarDispatch}
                    closePopover={() => setIsOpen(false)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
