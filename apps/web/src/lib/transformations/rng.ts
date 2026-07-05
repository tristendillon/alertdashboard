// Seeded RNG + string hashing used by the transformation preview so that
// "random" strategies render deterministically for a given seed.
//
// NOTE: This is a local copy. The backend shared core will export identical
// functions; a later integration pass may swap this import. The algorithms
// MUST stay exactly mulberry32 / FNV-1a so web-preview output matches the
// server-applied output byte-for-byte.

/**
 * mulberry32 — a tiny, fast, deterministic PRNG. Returns a function that
 * yields floats in [0, 1) on each call.
 */
export function createSeededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * FNV-1a 32-bit string hash. Used to derive a stable per-dispatch seed so a
 * given dispatch always produces the same "random" preview.
 */
export function hashStringToSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
