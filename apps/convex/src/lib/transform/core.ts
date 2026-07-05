// Pure, web-safe transformation core.
//
// This module MUST stay free of server-only imports: no `./_generated/server`,
// no `convex/server`, no node builtins. apps/web imports it (via the deep
// export path) to preview/apply transformations client-side, so anything here
// runs in the browser too. Only type-only imports from '../../api/schema' are
// allowed — they erase at build time.
import type {
  DispatchWithType,
  TransformationStrategy,
  TransformedDispatch,
} from '../../api/schema'

// --- Nested field access -------------------------------------------------

export function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

export function setNestedValue(obj: any, path: string, value: any): void {
  const keys = path.split('.')
  const lastKey = keys.pop()!
  const target = keys.reduce((current, key) => {
    if (!(key in current)) current[key] = {}
    return current[key]
  }, obj)
  target[lastKey] = value
}

// Walk to the parent of `path` and delete the leaf key. No-op if any
// intermediate object is missing (nothing to delete).
export function deleteNestedValue(obj: any, path: string): void {
  const keys = path.split('.')
  const lastKey = keys.pop()!
  let target = obj
  for (const key of keys) {
    if (target == null || typeof target !== 'object') return
    target = target[key]
  }
  if (target != null && typeof target === 'object') {
    delete target[lastKey]
  }
}

// --- Removable fields ----------------------------------------------------

// Fields remove_field is allowed to strip. `location` is whole-only:
// removing a single coordinate (location.lat / location.lng) breaks the map,
// so those are intentionally absent. Identity fields (type, dispatchId,
// dispatchGroup, dispatchCreatedAt, ids) are never removable.
export const REMOVABLE_FIELDS = [
  'location',
  'address',
  'address2',
  'city',
  'stateCode',
  'narrative',
  'unitCodes',
  'xrefId',
] as const

export type RemovableField = (typeof REMOVABLE_FIELDS)[number]

export function isRemovableField(field: string): field is RemovableField {
  return (REMOVABLE_FIELDS as readonly string[]).includes(field)
}

// --- Seeded randomness ---------------------------------------------------

export type RandomSource = () => number

// mulberry32: tiny, fast, deterministic PRNG. Given the same seed it yields
// the same sequence — used so previews are reproducible.
export function createSeededRandom(seed: number): RandomSource {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// FNV-1a hash → 32-bit seed for createSeededRandom.
export function hashStringToSeed(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

// --- Safe regex ----------------------------------------------------------

const MAX_REGEX_LENGTH = 200

// Compile a user-supplied pattern without ever throwing. Empty pattern is
// treated as "no regex" (regex: null). Over-long patterns are rejected to
// bound the damage from pathological input.
export function compileSafeRegex(pattern: string): {
  regex: RegExp | null
  error?: string
} {
  if (!pattern) return { regex: null }
  if (pattern.length > MAX_REGEX_LENGTH) {
    return { regex: null, error: `Pattern exceeds ${MAX_REGEX_LENGTH} characters` }
  }
  try {
    return { regex: new RegExp(pattern, 'i') }
  } catch (e) {
    return { regex: null, error: (e as Error).message }
  }
}

export function safeRegexTest(pattern: string, input: string): boolean {
  const { regex } = compileSafeRegex(pattern)
  if (!regex) return false
  return regex.test(input)
}

// --- Rule matching -------------------------------------------------------

export interface RuleCriteria {
  dispatchTypeRegex: string
  keywords: string[]
  dispatchTypes: string[]
}

// Synchronous, side-effect-free rule match. Matches when:
//  - the rule's dispatchTypes list includes this dispatch's dispatchType._id, OR
//  - the (case-insensitive) regex tests true against dispatch.type, OR
//  - any keyword is a lowercase substring of dispatch.type.
// Same semantics as the old async matcher, minus the crash on bad regex.
export function ruleMatchesDispatch(
  criteria: RuleCriteria,
  dispatch: DispatchWithType
): boolean {
  const typeId = dispatch.dispatchType?._id
  if (typeId && criteria.dispatchTypes.includes(typeId)) {
    return true
  }

  if (criteria.dispatchTypeRegex && safeRegexTest(criteria.dispatchTypeRegex, dispatch.type)) {
    return true
  }

  const lowerType = dispatch.type.toLowerCase()
  return criteria.keywords.some((keyword) =>
    lowerType.includes(keyword.toLowerCase())
  )
}

// --- Applying transformations -------------------------------------------

export type FieldTransformationConfig = {
  name: string
  field: string
  strategy: TransformationStrategy
  params: Record<string, any>
}

function applyStaticValue(config: FieldTransformationConfig): any {
  return config.params.value
}

function applyRandomOffset(
  value: any,
  config: FieldTransformationConfig,
  random: RandomSource
): any {
  if (typeof value !== 'number') return value
  const { minOffset, maxOffset } = config.params
  const randomOffset = random() * (maxOffset - minOffset) + minOffset
  return value + randomOffset
}

function applyRandomString(
  config: FieldTransformationConfig,
  random: RandomSource
): any {
  const { length = 8, charset = 'alphanumeric' } = config.params

  let chars = ''
  switch (charset) {
    case 'alphanumeric':
      chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
      break
    case 'alpha':
      chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
      break
    case 'numeric':
      chars = '0123456789'
      break
    default:
      chars = charset
  }

  return Array.from(
    { length },
    () => chars[Math.floor(random() * chars.length)]
  ).join('')
}

function applyMergeData(
  value: any,
  config: FieldTransformationConfig,
  source: any
): any {
  const { sourceFields, template, separator = '-' } = config.params

  if (template) {
    // Template-based merging: "{city}-{type}"
    return template.replace(
      /\{(\w+(?:\.\w+)*)\}/g,
      (match: string, fieldPath: string) => {
        return getNestedValue(source, fieldPath) || match
      }
    )
  } else if (sourceFields) {
    // Simple concatenation with separator
    return sourceFields
      .map((field: string) => getNestedValue(source, field))
      .filter(Boolean)
      .join(separator)
  }

  return value
}

// Apply an ordered list of field configs to a dispatch. The input dispatch is
// deep-cloned first (structuredClone) so the caller's object — and any nested
// `location` — is never mutated (fixes the shallow-copy aliasing bug).
//
// NOTE on merge_data source: it reads source field values from the
// in-progress (already partially transformed) clone, matching the historical
// engine behavior where earlier transformations in the list are visible to a
// later merge_data. Preserved intentionally.
export function applyTransformationConfigs(
  dispatch: DispatchWithType,
  configs: FieldTransformationConfig[],
  opts?: { random?: RandomSource }
): TransformedDispatch {
  const random = opts?.random ?? Math.random
  const result = structuredClone(dispatch) as any

  for (const config of configs) {
    if (config.strategy === 'remove_field') {
      // Only strip fields on the allowlist; ignore anything else silently.
      if (isRemovableField(config.field)) {
        deleteNestedValue(result, config.field)
      }
      continue
    }

    const currentValue = getNestedValue(result, config.field)
    let newValue: any
    switch (config.strategy) {
      case 'static_value':
        newValue = applyStaticValue(config)
        break
      case 'random_offset':
        newValue = applyRandomOffset(currentValue, config, random)
        break
      case 'random_string':
        newValue = applyRandomString(config, random)
        break
      case 'merge_data':
        newValue = applyMergeData(currentValue, config, result)
        break
      default:
        // Unknown strategy: leave the value untouched.
        newValue = currentValue
    }
    setNestedValue(result, config.field, newValue)
  }

  return result as TransformedDispatch
}

// --- Config validation ---------------------------------------------------

const KNOWN_STRATEGIES: readonly TransformationStrategy[] = [
  'static_value',
  'random_offset',
  'random_string',
  'merge_data',
  'remove_field',
]

// Human-readable validation errors for a single config. Empty array = valid.
export function validateTransformationConfig(
  config: FieldTransformationConfig
): string[] {
  const errors: string[] = []
  const label = config.name || config.field || '(unnamed)'

  if (!KNOWN_STRATEGIES.includes(config.strategy)) {
    errors.push(`"${label}": unknown strategy "${config.strategy}"`)
    return errors
  }

  const params = config.params ?? {}

  switch (config.strategy) {
    case 'remove_field':
      if (!isRemovableField(config.field)) {
        errors.push(
          `"${label}": field "${config.field}" is not removable (removable: ${REMOVABLE_FIELDS.join(', ')})`
        )
      }
      break
    case 'random_offset': {
      const { minOffset, maxOffset } = params
      if (typeof minOffset !== 'number' || typeof maxOffset !== 'number') {
        errors.push(
          `"${label}": random_offset requires numeric minOffset and maxOffset`
        )
      } else if (minOffset > maxOffset) {
        errors.push(`"${label}": random_offset minOffset must be <= maxOffset`)
      }
      break
    }
    case 'static_value':
      if (!('value' in params)) {
        errors.push(`"${label}": static_value requires a value param`)
      }
      break
    case 'merge_data':
      if (!params.template && !params.sourceFields) {
        errors.push(
          `"${label}": merge_data requires either a template or sourceFields`
        )
      }
      break
    default:
      // random_string has no required params.
      break
  }

  return errors
}
