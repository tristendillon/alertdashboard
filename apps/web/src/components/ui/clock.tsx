"use client";

import { useEffect, useState } from "react";

export function Clock() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="min-w-32 text-center text-lg font-semibold md:text-2xl">
      {time?.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })}
      <br />
      {time?.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })}
    </span>
  );
}
