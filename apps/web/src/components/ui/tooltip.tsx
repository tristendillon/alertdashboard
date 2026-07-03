"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import { cn } from "@/utils/ui";

// Context to share mouse position between trigger and content
const MouseTooltipContext = React.createContext<{
  mousePosition: { x: number; y: number };
  setMousePosition: React.Dispatch<
    React.SetStateAction<{ x: number; y: number }>
  >;
  followMouse: boolean;
  isHovering: boolean;
  setIsHovering: React.Dispatch<React.SetStateAction<boolean>>;
} | null>(null);

function TooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  );
}

function Tooltip({
  followMouse = false,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root> & {
  followMouse?: boolean;
}) {
  const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = React.useState(false);

  return (
    <MouseTooltipContext.Provider
      value={{
        mousePosition,
        setMousePosition,
        followMouse,
        isHovering,
        setIsHovering,
      }}
    >
      <TooltipProvider>
        <TooltipPrimitive.Root data-slot="tooltip" {...props} />
      </TooltipProvider>
    </MouseTooltipContext.Provider>
  );
}

function TooltipTrigger({
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  const context = React.useContext(MouseTooltipContext);
  const rafRef = React.useRef<number>(0);

  const handleMouseMove = React.useCallback(
    (e: React.MouseEvent) => {
      if (!context?.followMouse) return;

      // Cancel any pending animation frame
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      // Use requestAnimationFrame for smooth updates
      rafRef.current = requestAnimationFrame(() => {
        context.setMousePosition({ x: e.clientX, y: e.clientY });
      });
    },
    [context],
  );

  const handleMouseEnter = React.useCallback(() => {
    if (context?.followMouse) {
      context.setIsHovering(true);
    }
  }, [context]);

  const handleMouseLeave = React.useCallback(() => {
    if (context?.followMouse) {
      context.setIsHovering(false);
    }
  }, [context]);

  React.useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return (
    <TooltipPrimitive.Trigger
      data-slot="tooltip-trigger"
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </TooltipPrimitive.Trigger>
  );
}

function TooltipContent({
  className,
  sideOffset = 0,
  children,
  offset = { x: 10, y: 10 },
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content> & {
  offset?: { x: number; y: number };
}) {
  const context = React.useContext(MouseTooltipContext);

  if (context?.followMouse) {
    // Only render if we're hovering over the trigger
    if (!context.isHovering) {
      return null;
    }

    return (
      <TooltipPrimitive.Portal>
        <div
          data-slot="tooltip-content"
          className={cn(
            "bg-primary text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 pointer-events-none z-50 w-fit rounded-md px-3 py-1.5 text-xs text-balance",
            className,
          )}
          style={{
            position: "fixed",
            left: context.mousePosition.x + offset.x,
            top: context.mousePosition.y + offset.y,
          }}
        >
          {children}
          {/* No arrow for mouse-following tooltips */}
        </div>
      </TooltipPrimitive.Portal>
    );
  }

  // Default behavior (original code)
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "bg-primary text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit origin-(--radix-tooltip-content-transform-origin) rounded-md px-3 py-1.5 text-xs text-balance",
          className,
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className="bg-primary fill-primary z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px]" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
