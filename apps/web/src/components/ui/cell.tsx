import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/utils/ui";

const cellVariants = cva(
  "group flex items-center transition-all rounded-md min-h-9",
  {
    variants: {
      variant: {
        default: "",
        interactive: "hover:bg-muted/50 cursor-pointer focus-visible:bg-muted focus-visible:outline-2 focus-visible:outline-ring",
        subtle: "text-muted-foreground",
        expandable: "hover:bg-muted/50 cursor-pointer",
      },
      size: {
        default: "px-2 py-1",
        sm: "px-1.5 py-0.5 text-sm",
        lg: "px-3 py-2",
        none: "",
      },
      align: {
        start: "justify-start",
        center: "justify-center", 
        end: "justify-end",
        between: "justify-between",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      align: "start",
    },
  },
);

export interface CellProps
  extends React.ComponentProps<"div">,
    VariantProps<typeof cellVariants> {
  asChild?: boolean;
}

function Cell({
  className,
  variant,
  size,
  align,
  asChild = false,
  ...props
}: CellProps) {
  const Comp = asChild ? Slot : "div";

  return (
    <Comp
      data-slot="cell"
      className={cn(cellVariants({ variant, size, align, className }))}
      {...props}
    />
  );
}

function CellContent({ 
  className, 
  truncate = true,
  ...props 
}: React.ComponentProps<"div"> & { truncate?: boolean }) {
  return (
    <div
      data-slot="cell-content"
      className={cn(
        "flex-1 min-w-0",
        truncate && "truncate",
        className
      )}
      {...props}
    />
  );
}

function CellAction({ 
  className, 
  ...props 
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="cell-action"
      className={cn(
        "flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity",
        "ml-2 flex-shrink-0",
        className
      )}
      {...props}
    />
  );
}

function CellPrefix({ 
  className, 
  ...props 
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="cell-prefix"
      className={cn(
        "flex items-center justify-center mr-2 flex-shrink-0",
        className
      )}
      {...props}
    />
  );
}

function CellSuffix({ 
  className, 
  ...props 
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="cell-suffix"
      className={cn(
        "flex items-center justify-center ml-2 flex-shrink-0",
        className
      )}
      {...props}
    />
  );
}

export {
  Cell,
  CellContent,
  CellAction,
  CellPrefix,
  CellSuffix,
  cellVariants,
};