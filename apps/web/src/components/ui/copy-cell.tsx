"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/utils/ui";
import { Cell, CellContent, CellAction, type CellProps } from "./cell";

interface CopyCellProps extends Omit<CellProps, "variant" | "asChild" | "onClick"> {
  value: string;
  displayValue?: string;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export function CopyCell({ 
  value, 
  displayValue, 
  className,
  onClick,
  ...props 
}: CopyCellProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
    }

    // Call any additional onClick handler
    onClick?.(e);
  };

  const valueToDisplay = displayValue || value;

  return (
    <Cell
      variant="interactive"
      align="between"
      className={className}
      onClick={handleCopy}
      title={copied ? "Copied!" : "Click to copy"}
      aria-label={copied ? "Copied to clipboard" : "Click to copy to clipboard"}
      {...props}
    >
      <CellContent truncate>
        {valueToDisplay}
      </CellContent>
      <CellAction>
        <div
          className={cn(
            "flex h-4 w-4 items-center justify-center transition-colors",
            copied ? "text-green-600" : "text-muted-foreground"
          )}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </div>
      </CellAction>
    </Cell>
  );
}