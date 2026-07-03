"use client";

import {
  DISPLAY_DURATION_MS,
  useActiveDispatch,
} from "@/providers/active-dispatch-provider";
import { cn } from "@/utils/ui";

export function TurnoutTimer() {
  const { timeLeft } = useActiveDispatch();

  if (timeLeft === 0) return null;

  // Calculate progress percentage (0-100)
  const progress = Math.max(
    0,
    Math.min(100, (timeLeft / DISPLAY_DURATION_MS) * 100),
  );

  // Calculate stroke dash array for the progress circle
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Format time display as hh:mm:ss:mil
  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
  const milliseconds = Math.floor((timeLeft % 1000) / 10); // Show centiseconds (0-99)

  let formattedTime;
  if (hours > 0) {
    formattedTime = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}:${milliseconds.toString().padStart(2, "0")}`;
  } else {
    formattedTime = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}:${milliseconds.toString().padStart(2, "0")}`;
  }
  // Determine color based on progress
  const getColor = () => {
    if (progress > 66) return "text-green-500";
    if (progress > 33) return "text-orange-500";
    return "text-red-500";
  };

  const getStrokeColor = () => {
    if (progress > 66) return "#10b981"; // green-500
    if (progress > 33) return "#f97316"; // orange-500
    return "#ef4444"; // red-500
  };

  return (
    <div className="flex items-center justify-center">
      <div className="relative h-28 w-28">
        {/* Background circle */}
        <svg
          className="h-full w-full -rotate-90 transform"
          viewBox="0 0 100 100"
        >
          {/* Background track */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className="text-muted-foreground/20"
          />

          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={getStrokeColor()}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-300 ease-out"
          />
        </svg>

        {/* Timer text in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={cn("text-md font-mono font-bold", getColor())}>
            {formattedTime}
          </div>
        </div>
      </div>
    </div>
  );
}
