import { env } from "@/env";
import { useEffect, useState } from "react";

const buildTimeUnits = () => {
  const SECOND = 1000;
  const MINUTE = 60 * SECOND;
  const HOUR = 60 * MINUTE;
  const DAY = 24 * HOUR;
  const WEEK = 7 * DAY;
  const MONTH = 30 * DAY;
  const YEAR = 365 * DAY;

  return { SECOND, MINUTE, HOUR, DAY, WEEK, MONTH, YEAR } as const;
};

export const TIME_UNITS = buildTimeUnits();

// Relative time unit definitions
const RELATIVE_TIME_UNITS = [
  { limit: TIME_UNITS.MINUTE, divisor: TIME_UNITS.SECOND, unit: "second" },
  { limit: TIME_UNITS.HOUR, divisor: TIME_UNITS.MINUTE, unit: "minute" },
  { limit: TIME_UNITS.DAY, divisor: TIME_UNITS.HOUR, unit: "hour" },
  { limit: TIME_UNITS.WEEK, divisor: TIME_UNITS.DAY, unit: "day" },
  { limit: TIME_UNITS.MONTH, divisor: TIME_UNITS.WEEK, unit: "week" },
  { limit: TIME_UNITS.YEAR, divisor: TIME_UNITS.MONTH, unit: "month" },
  { limit: Infinity, divisor: TIME_UNITS.YEAR, unit: "year" },
] as const;

const FORMATTING_THRESHOLDS = {
  CURRENT_TIME_WINDOW: TIME_UNITS.HOUR,
  RELATIVE_DATE_WINDOW: TIME_UNITS.WEEK,
} as const;

export type DateTimeFormatVariant =
  | "relative"
  | "relative-date"
  | "short-12h"
  | "short-24h"
  | "long-12h"
  | "long-24h"
  | "short-date"
  | "long-date";

type DateTimeFormatter = (timestamp: number, localeOverride?: string) => string;

/**
 * Gets the default locale, with SSR-safe fallback
 */
function getDefaultLocale(): string {
  return typeof navigator !== "undefined" ? navigator.language : "en-US";
}

/**
 * Checks if two dates represent the same calendar day
 */
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Gets the day difference between two dates (positive for future, negative for past)
 */
function getDayDifference(targetDate: Date, referenceDate: Date): number {
  // Use the configured timezone from environment, with fallback
  const tz =
    (typeof env !== "undefined" && env.NEXT_PUBLIC_DB_TIMEZONE) || "UTC";

  // Helper to get the date parts in the specified timezone
  function getTzDateParts(date: Date) {
    const dtf = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const [{ value: month }, , { value: day }, , { value: year }] =
      dtf.formatToParts(date);
    return { year: Number(year), month: Number(month), day: Number(day) };
  }

  const targetParts = getTzDateParts(targetDate);
  const referenceParts = getTzDateParts(referenceDate);

  // Create UTC dates at midnight for both, so the difference is in full days
  const targetMidnightUTC = Date.UTC(
    targetParts.year,
    targetParts.month - 1,
    targetParts.day,
  );
  const referenceMidnightUTC = Date.UTC(
    referenceParts.year,
    referenceParts.month - 1,
    referenceParts.day,
  );

  return Math.round(
    (targetMidnightUTC - referenceMidnightUTC) / TIME_UNITS.DAY,
  );
}

export function timeStampFormatter(
  variant: DateTimeFormatVariant,
): DateTimeFormatter {
  switch (variant) {
    case "relative": {
      const rtfCache = new Map<string, Intl.RelativeTimeFormat>();

      return (timestamp, locale = getDefaultLocale()) => {
        const now = Date.now();
        const diff = timestamp - now;
        const absDiff = Math.abs(diff);

        const { unit, divisor } = RELATIVE_TIME_UNITS.find(
          (u) => absDiff < u.limit,
        )!;
        const rtf =
          rtfCache.get(locale) ??
          new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
        rtfCache.set(locale, rtf);
        return rtf.format(
          Math.round(diff / divisor),
          unit as Intl.RelativeTimeFormatUnit,
        );
      };
    }

    case "relative-date": {
      const rtfCache = new Map<string, Intl.RelativeTimeFormat>();
      const dtfCache = new Map<string, Intl.DateTimeFormat>();

      return (timestamp, locale = getDefaultLocale()) => {
        const targetDate = new Date(timestamp);
        const now = new Date();
        const timeDiff = timestamp - now.getTime();
        const absTimeDiff = Math.abs(timeDiff);

        const isCurrentTime =
          absTimeDiff <= FORMATTING_THRESHOLDS.CURRENT_TIME_WINDOW;
        const isToday = isSameDay(targetDate, now);

        if (isCurrentTime) {
          return "Current";
        }

        if (isToday) {
          return "Today";
        }

        // For dates within the relative window, use smart relative formatting
        if (absTimeDiff <= FORMATTING_THRESHOLDS.RELATIVE_DATE_WINDOW) {
          const daysDiff = getDayDifference(targetDate, now);

          // Handle special cases
          if (daysDiff === -1) return "Yesterday";
          if (daysDiff === 1) return "Tomorrow";

          // For past dates within a week, use relative time ("3 days ago")
          if (daysDiff < 0) {
            const rtf =
              rtfCache.get(locale) ??
              new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
            rtfCache.set(locale, rtf);
            return rtf.format(daysDiff, "day");
          }
        }

        // For future dates beyond tomorrow, or past dates beyond a week, use short date
        if (!dtfCache.has(locale)) {
          dtfCache.set(
            locale,
            new Intl.DateTimeFormat(locale, {
              weekday: "short",
              month: "short",
              day: "numeric",
            }),
          );
        }
        return dtfCache.get(locale)!.format(targetDate);
      };
    }

    case "short-date":
    case "long-date": {
      const options: Intl.DateTimeFormatOptions =
        variant === "short-date"
          ? { month: "short", day: "numeric" }
          : { year: "numeric", month: "long", day: "numeric", weekday: "long" };

      const dtfCache = new Map<string, Intl.DateTimeFormat>();

      return (timestamp, locale = getDefaultLocale()) => {
        if (!dtfCache.has(locale)) {
          dtfCache.set(locale, new Intl.DateTimeFormat(locale, options));
        }
        return dtfCache.get(locale)!.format(new Date(timestamp));
      };
    }

    case "short-12h":
    case "short-24h":
    case "long-12h":
    case "long-24h": {
      const hour12 = variant.includes("12h");
      const long = variant.startsWith("long");
      const options: Intl.DateTimeFormatOptions = {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12,
        ...(long && { year: "numeric", weekday: "short" }),
      };

      const dtfCache = new Map<string, Intl.DateTimeFormat>();

      return (timestamp, locale = getDefaultLocale()) => {
        if (!dtfCache.has(locale)) {
          dtfCache.set(locale, new Intl.DateTimeFormat(locale, options));
        }
        return dtfCache.get(locale)!.format(new Date(timestamp));
      };
    }
  }
}

type FormatterResult = {
  format: (timestamp: number, locale?: string) => string;
  isHydrated: boolean;
};

/**
 * Hook that provides SSR-safe timestamp formatting
 * Returns a formatter function and hydration state
 */
export function useFormatter(variant: DateTimeFormatVariant): FormatterResult {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const format = (timestamp: number, locale?: string): string => {
    if (!isHydrated) {
      const fallbackFormatter = new Intl.DateTimeFormat(locale || "en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      return fallbackFormatter.format(new Date(timestamp));
    }

    // After hydration, use the full formatter with all features
    const formatter = timeStampFormatter(variant);
    return formatter(timestamp, locale);
  };

  return { format, isHydrated };
}
