// Bounded, safe regex compilation + matching for the rule editor's
// dispatch-type pattern feedback. Compilation is always case-insensitive and
// never throws; matching truncates input. Zero-length matches (`^`, `a*`)
// still count as matches — the server engine uses regex.test(), so the
// feedback must agree — they just yield an empty span to highlight.

interface CompileOptions {
  maxPatternLength?: number;
}

interface CompileResult {
  regex: RegExp | null;
  error?: string;
}

/**
 * Compile `pattern` into a case-insensitive RegExp. An empty pattern yields a
 * null regex with no error; an over-length or syntactically invalid pattern
 * yields a null regex with an `error` message.
 */
export function compileSafeRegex(
  pattern: string,
  { maxPatternLength = 200 }: CompileOptions = {},
): CompileResult {
  if (!pattern) return { regex: null };
  if (pattern.length > maxPatternLength) {
    return {
      regex: null,
      error: `Pattern too long (max ${maxPatternLength} characters)`,
    };
  }
  try {
    return { regex: new RegExp(pattern, "i") };
  } catch (e) {
    return {
      regex: null,
      error: e instanceof Error ? e.message : "Invalid pattern",
    };
  }
}

/**
 * Find the first match span of `regex` within `input` (truncated to 300
 * chars). Returns `{ start, end }` character offsets — equal for a
 * zero-length match — or null when the regex does not match at all.
 */
export function matchSpan(
  regex: RegExp,
  input: string,
): { start: number; end: number } | null {
  const text = input.slice(0, 300);
  const m = new RegExp(regex.source, regex.flags.replace(/g/g, "")).exec(text);
  if (!m) return null;
  return { start: m.index, end: m.index + m[0].length };
}
