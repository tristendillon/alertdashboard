"use client";

import { GripVertical } from "lucide-react";
import { Group, Panel, Separator } from "react-resizable-panels";

import { cn } from "@/utils/ui";

const ResizablePanelGroup = ({
  className,
  ...props
}: React.ComponentProps<typeof Group>) => (
  <Group className={cn("h-full w-full", className)} {...props} />
);

// v4 applies inline overflow:auto to the panel's inner div; force hidden to
// match v3 behavior since ViewMap/ViewSidebar manage their own scrolling
const ResizablePanel = ({
  style,
  ...props
}: React.ComponentProps<typeof Panel>) => (
  <Panel style={{ overflow: "hidden", ...style }} {...props} />
);

// Handle offset allows for the handle to be offset from the edge of the panel
// based on the orientation of the parent panel group
const ResizableHandle = ({
  withHandle,
  className,
  offset = 0,
  groupOrientation = "horizontal",
  style,
  ...props
}: React.ComponentProps<typeof Separator> & {
  withHandle?: boolean;
  offset?: number;
  groupOrientation?: "horizontal" | "vertical";
}) => {
  const isVertical = groupOrientation === "vertical";

  return (
    <Separator
      className={cn(
        "focus-visible:ring-ring relative flex items-center justify-center focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:outline-none",
        isVertical
          ? "h-px w-full after:absolute after:inset-x-0 after:top-1/2 after:h-1 after:-translate-y-1/2"
          : "w-px after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2",
        className,
      )}
      style={{
        ...(isVertical
          ? {
              // Vertical layout: move handle from top
              top: offset !== 0 ? `${offset}px` : undefined,
            }
          : {
              // Horizontal layout: move handle from left
              left: offset !== 0 ? `${offset}px` : undefined,
            }),
        ...style,
      }}
      {...props}
    >
      {withHandle && (
        <div
          className={cn(
            "bg-muted z-10 flex h-4 w-3 items-center justify-center rounded-sm border",
            isVertical && "rotate-90",
          )}
        >
          <GripVertical className="h-2.5 w-2.5" />
        </div>
      )}
    </Separator>
  );
};

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
