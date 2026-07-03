import type { ActiveWeatherAlertsSchema } from "@sizeupdashboard/convex/src/api/schema.ts";
import { type z } from "zod";
import React from "react";
import { cn } from "@/utils/ui";
import { timeStampFormatter } from "@/utils/timestamp";

// Define alert severity levels and their corresponding colors
const getAlertSeverity = (
  event: string,
): { level: string; colorClass: string; textColor: string } => {
  const eventLower = event.toLowerCase();

  // Emergency/Extreme alerts (Red)
  if (
    eventLower.includes("warning") ||
    eventLower.includes("emergency") ||
    eventLower.includes("tornado") ||
    eventLower.includes("hurricane") ||
    eventLower.includes("severe thunderstorm") ||
    eventLower.includes("flash flood") ||
    eventLower.includes("blizzard") ||
    eventLower.includes("ice storm")
  ) {
    return {
      level: "Warning",
      colorClass: "bg-red-500/60",
      textColor: "text-white",
    };
  }

  // Watch alerts (Orange)
  if (
    eventLower.includes("watch") ||
    eventLower.includes("fire weather") ||
    eventLower.includes("high wind") ||
    eventLower.includes("winter storm")
  ) {
    return {
      level: "Watch",
      colorClass: "bg-orange-500/60",
      textColor: "text-white",
    };
  }

  // Advisory alerts (Yellow)
  if (
    eventLower.includes("advisory") ||
    eventLower.includes("statement") ||
    eventLower.includes("special weather") ||
    eventLower.includes("frost") ||
    eventLower.includes("freeze") ||
    eventLower.includes("heat")
  ) {
    return {
      level: "Advisory",
      colorClass: "bg-yellow-500/60",
      textColor: "text-black",
    };
  }

  // Fire ban (Purple)
  if (eventLower.includes("fire ban") || eventLower.includes("burn ban")) {
    return {
      level: "Fire Ban",
      colorClass: "bg-purple-500/60",
      textColor: "text-white",
    };
  }

  // Air quality (Brown)
  if (
    eventLower.includes("air quality") ||
    eventLower.includes("smoke") ||
    eventLower.includes("dust") ||
    eventLower.includes("smog")
  ) {
    return {
      level: "Air Quality",
      colorClass: "bg-amber-700/60",
      textColor: "text-white",
    };
  }

  // Flood/Water alerts (Blue)
  if (
    eventLower.includes("flood") ||
    eventLower.includes("coastal") ||
    eventLower.includes("marine") ||
    eventLower.includes("tsunami")
  ) {
    return {
      level: "Flood/Marine",
      colorClass: "bg-blue-500/60",
      textColor: "text-white",
    };
  }

  // Default (Gray)
  return {
    level: "General",
    colorClass: "bg-gray-500/60",
    textColor: "text-white",
  };
};

// Context for sharing alert data
type WeatherAlertType = z.infer<typeof ActiveWeatherAlertsSchema>;
const AlertContext = React.createContext<WeatherAlertType | null>(null);

const useAlert = () => {
  const context = React.useContext(AlertContext);
  if (!context) {
    throw new Error("Alert components must be used within an Alert");
  }
  return context;
};

// Main Alert component
const WeatherAlert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { alert: WeatherAlertType }
>(({ alert, className, ...props }, ref) => {
  const { colorClass, textColor } = getAlertSeverity(alert.event);

  return (
    <AlertContext.Provider value={alert}>
      <div
        ref={ref}
        className={cn(
          "rounded-lg border-l-4 border-l-white/50 p-4 shadow-lg backdrop-blur-[2px]",
          colorClass,
          textColor,
          className,
        )}
        {...props}
      />
    </AlertContext.Provider>
  );
});
WeatherAlert.displayName = "WeatherAlert";

// Alert Header with title and badge
const WeatherAlertHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "mb-2 flex w-full items-center justify-between gap-2",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
});
WeatherAlertHeader.displayName = "WeatherAlertHeader";

// Alert Title
const WeatherAlertTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => {
  const alert = useAlert();

  return (
    <h3 ref={ref} className={cn("text-lg font-bold", className)} {...props}>
      {alert.event}
    </h3>
  );
});
WeatherAlertTitle.displayName = "WeatherAlertTitle";

const WeatherAlertSeverity = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => {
  const alert = useAlert();
  const severity = getAlertSeverity(alert.event);
  return (
    <WeatherAlertBadge
      ref={ref}
      className={cn(
        "rounded bg-white/20 px-2 py-1 text-sm font-medium",
        className,
      )}
      {...props}
    >
      {severity.level}
    </WeatherAlertBadge>
  );
});
WeatherAlertSeverity.displayName = "WeatherAlertSeverity";

// Alert Badge
const WeatherAlertBadge = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => {
  return (
    <span
      ref={ref}
      className={cn(
        "rounded bg-white/20 px-2 py-1 text-sm font-medium",
        className,
      )}
      {...props}
    />
  );
});
WeatherAlertBadge.displayName = "WeatherAlertBadge";

// Alert Description
const WeatherAlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const alert = useAlert();

  return (
    <p
      ref={ref}
      className={cn("mb-3 line-clamp-3 text-sm opacity-90", className)}
      {...props}
    >
      {alert.description}
    </p>
  );
});
WeatherAlertDescription.displayName = "WeatherAlertDescription";

type WeatherAlertTimeRangeProps = React.HTMLAttributes<HTMLDivElement> & {
  format: "short-12h" | "short-24h";
};

// Alert Time Range
const WeatherAlertTimeRange = React.forwardRef<
  HTMLDivElement,
  WeatherAlertTimeRangeProps
>(({ className, format, ...props }, ref) => {
  const alert = useAlert();
  const formatShort = timeStampFormatter(format);
  const start = formatShort(alert.start);
  const end = formatShort(alert.end);
  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center space-x-4 text-sm opacity-90",
        className,
      )}
      {...props}
    >
      <span>
        <strong>From:</strong> {start}
      </span>
      <span>
        <strong>Until:</strong> {end}
      </span>
    </div>
  );
});
WeatherAlertTimeRange.displayName = "WeatherAlertTimeRange";

// Alert Tags
const WeatherAlertTags = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const alert = useAlert();

  if (alert.tags.length === 0) return null;

  return (
    <div
      ref={ref}
      className={cn("mt-2 flex flex-wrap gap-1", className)}
      {...props}
    >
      {alert.tags.map((tag, index) => (
        <span
          key={index}
          className="rounded-full bg-white/20 px-2 py-1 text-xs"
        >
          {tag}
        </span>
      ))}
    </div>
  );
});
WeatherAlertTags.displayName = "WeatherAlertTags";

// Alert Footer
const WeatherAlertFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-wrap items-center justify-between text-sm",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
});
WeatherAlertFooter.displayName = "WeatherAlertFooter";

const WeatherAlertSender = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => {
  const alert = useAlert();

  return (
    <span ref={ref} className={cn("text-xs opacity-75", className)} {...props}>
      {alert.senderName}
    </span>
  );
});
WeatherAlertSender.displayName = "WeatherAlertSender";

export {
  WeatherAlert,
  WeatherAlertHeader,
  WeatherAlertTitle,
  WeatherAlertBadge,
  WeatherAlertDescription,
  WeatherAlertTimeRange,
  WeatherAlertTags,
  WeatherAlertFooter,
  WeatherAlertSender,
  WeatherAlertSeverity,
};
