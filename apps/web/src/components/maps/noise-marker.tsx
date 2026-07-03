import { AdvancedMarker } from "@vis.gl/react-google-maps";
import { cn } from "@/utils/ui";
import Image from "next/image";
import { useDispatches } from "@/providers/dispatches-provider";
import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useActiveDispatch } from "@/providers/active-dispatch-provider";
import useDebounce from "@/hooks/use-debounce";
import { ApproximationWarning } from "@/components/ui/approximation-warning";
import type { DispatchWithType } from "@sizeupdashboard/convex/src/api/schema.ts";
import { SquareArrowOutUpRight } from "lucide-react";

interface NoiseMarkerProps {
  dispatch: DispatchWithType;
  className?: string;
}

interface NoiseCardProps {
  dispatch: DispatchWithType;
  className?: string;
  closePopover: () => void;
}

function NoiseCard({ dispatch, className, closePopover }: NoiseCardProps) {
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

export default function NoiseMarker({ dispatch, className }: NoiseMarkerProps) {
  const { getDispatchesInRadius } = useDispatches();
  const [isOpen, _setIsOpen] = useState(false);
  const setIsOpen = useDebounce(_setIsOpen, 100);
  const [similarDispatches, setSimilarDispatches] = useState<
    DispatchWithType[]
  >([]);
  const location = dispatch.location;

  const handleMarkerClick = async () => {
    if (isOpen) {
      setIsOpen(false);
      return;
    }
    setIsOpen(true);

    // Get similar dispatches and exclude the current dispatch
    const dispatches = getDispatchesInRadius(location, 10);
    const uniqueDispatches = dispatches.filter(
      (d) => d.dispatchId !== dispatch.dispatchId,
    );
    setSimilarDispatches(uniqueDispatches);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <AdvancedMarker
          zIndex={100}
          onClick={handleMarkerClick}
          className={cn("relative cursor-pointer", className)}
          position={location}
        >
          <Image
            src={dispatch.icon ?? ""}
            alt={dispatch.type}
            width={40}
            height={40}
          />
        </AdvancedMarker>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center space-x-2">
            <Image
              src={dispatch.icon ?? ""}
              alt={dispatch.type}
              width={24}
              height={24}
            />
            <h3 className="text-lg font-semibold capitalize">
              {dispatch.type}
            </h3>
          </div>

          {/* Approximation warning */}
          <ApproximationWarning
            dispatchGroup={dispatch.group as string}
            variant="compact"
          />

          {/* Main dispatch info */}
          <div className="text-muted-foreground text-sm">
            <p>Dispatch ID: {dispatch.dispatchId}</p>
          </div>

          {/* Current dispatch card */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Current Incident:</h4>
            <NoiseCard
              dispatch={dispatch}
              closePopover={() => setIsOpen(false)}
            />
          </div>

          {/* Similar incidents */}
          {similarDispatches.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">
                Similar Incidents ({similarDispatches.length}):
              </h4>
              <div className="max-h-48 space-y-2 overflow-y-auto pr-2">
                {similarDispatches.map((similarDispatch, index) => (
                  <NoiseCard
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
