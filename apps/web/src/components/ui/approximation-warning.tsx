import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/utils/ui";
import { useAuth } from "@clerk/nextjs";
import { useViewToken } from "@/providers/view-providers";

const approximationWarningVariants = cva(
  "text-destructive text-center text-sm italic",
  {
    variants: {
      variant: {
        full: "mx-auto max-w-md",
        compact: "mx-auto max-w-xs text-xs",
      },
    },
    defaultVariants: {
      variant: "full",
    },
  },
);

export interface ApproximationWarningProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof approximationWarningVariants> {
  dispatchGroup?: string;
  asChild?: boolean;
}

const ApproximationWarning = React.forwardRef<
  HTMLDivElement,
  ApproximationWarningProps
>(({ className, variant, dispatchGroup, ...props }, ref) => {
  const { isLoaded, isSignedIn } = useAuth();
  const { tokenId } = useViewToken();

  const authStatus = {
    isLoaded: isLoaded,
    authorized: isSignedIn || !!tokenId,
  };

  // Don't render if user is authorized or not loaded, or if dispatch group is not sensitive
  if (
    !authStatus.isLoaded ||
    authStatus.authorized ||
    !["law", "rescue", "medical"].includes(dispatchGroup ?? "")
  ) {
    return null;
  }

  if (variant === "compact") {
    return (
      <div
        className={cn(approximationWarningVariants({ variant }), className)}
        ref={ref}
        {...props}
      >
        <p className="text-left">
          Location is approximate for privacy and safety. Do not disturb
          residents.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(approximationWarningVariants({ variant }), className)}
      ref={ref}
      {...props}
    >
      <ul className="list-disc space-y-2 pl-6 text-left">
        <li>
          The location shown is intentionally approximate and does not represent
          the exact incident address.
        </li>
        <li>
          For privacy and safety reasons, some details are redacted or
          generalized. Do not rely on this location to determine the actual
          incident site.
        </li>
        <li>
          Do not disturb or harass residents or individuals near the displayed
          location.
        </li>
      </ul>
    </div>
  );
});
ApproximationWarning.displayName = "ApproximationWarning";

export { ApproximationWarning, approximationWarningVariants };
