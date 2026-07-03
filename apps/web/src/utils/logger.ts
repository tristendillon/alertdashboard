import { env } from "@/env";

type LogLevel = "error" | "warn" | "info" | "debug";

const ENV = process.env.NODE_ENV;
const IS_VERBOSE = env.NEXT_PUBLIC_LOG_VERBOSE === "true";

const levels: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const currentLevel = (() => {
  if (ENV === "production") return "error"; // Only show errors in prod
  if (IS_VERBOSE) return "debug"; // Verbose mode shows everything
  return "info"; // Default for dev
})();

function shouldLog(level: LogLevel) {
  return levels[level] <= levels[currentLevel];
}

export const logger = {
  error: (...args: unknown[]) =>
    shouldLog("error") && console.error("[ERROR]", ...args),
  warn: (...args: unknown[]) =>
    shouldLog("warn") && console.warn("[WARN]", ...args),
  info: (...args: unknown[]) =>
    shouldLog("info") && console.info("[INFO]", ...args),
  debug: (...args: unknown[]) =>
    shouldLog("debug") && console.debug("[DEBUG]", ...args),
};
