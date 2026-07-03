import { AdvancedMarker } from "@vis.gl/react-google-maps";
import { cn } from "@/utils/ui";
import Image from "next/image";
import type { DispatchWithType } from "@sizeupdashboard/convex/src/api/schema.ts";

interface IncidentMarkerProps {
  dispatch?: DispatchWithType;
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function IncidentMarker({
  dispatch,
  children,
  className,
  onClick,
}: IncidentMarkerProps) {
  return (
    <AdvancedMarker
      onClick={onClick}
      className={cn("relative", className)}
      position={dispatch?.location}
    >
      <Image
        src={dispatch?.icon ?? ""}
        alt={dispatch?.type ?? "other"}
        width={40}
        height={40}
      />
      {children}
    </AdvancedMarker>
  );
}
