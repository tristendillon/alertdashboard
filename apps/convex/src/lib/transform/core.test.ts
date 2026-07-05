import { describe, expect, it } from 'vitest'
import {
  applyTransformationConfigs,
  compileSafeRegex,
  createSeededRandom,
  deleteNestedValue,
  hashStringToSeed,
  ruleMatchesDispatch,
  safeRegexTest,
  validateTransformationConfig,
  type FieldTransformationConfig,
} from './core'
import type { DispatchWithType } from '../../api/schema'

// Minimal DispatchWithType fixture. `as` keeps the tests focused on the fields
// the core actually touches without hand-writing every schema field.
function makeDispatch(
  overrides: Partial<DispatchWithType> = {}
): DispatchWithType {
  return {
    _id: 'dispatch_1',
    _creationTime: 0,
    dispatchId: 1,
    type: 'Structure Fire',
    address: '123 Main St',
    location: { lat: 40.5, lng: -111.9 },
    unitCodes: ['E1'],
    dispatchGroup: 'fire',
    dispatchCreatedAt: 1000,
    narrative: 'smoke showing',
    city: 'Provo',
    stateCode: 'UT',
    ...overrides,
  } as DispatchWithType
}

describe('deleteNestedValue', () => {
  it('deletes the leaf key', () => {
    const obj = { a: { b: 1, c: 2 } }
    deleteNestedValue(obj, 'a.b')
    expect('b' in obj.a).toBe(false)
    expect(obj.a.c).toBe(2)
  })

  it('is a no-op when the parent is missing', () => {
    const obj: any = { a: 1 }
    expect(() => deleteNestedValue(obj, 'x.y.z')).not.toThrow()
    expect(obj).toEqual({ a: 1 })
  })
})

describe('applyTransformationConfigs — remove_field', () => {
  it('removes the whole field key from the result', () => {
    const dispatch = makeDispatch()
    const result = applyTransformationConfigs(dispatch, [
      { name: 'strip loc', field: 'location', strategy: 'remove_field', params: {} },
    ])
    expect('location' in result).toBe(false)
  })

  it('ignores remove_field on a non-removable field', () => {
    const dispatch = makeDispatch()
    const result = applyTransformationConfigs(dispatch, [
      { name: 'bad', field: 'type', strategy: 'remove_field', params: {} },
    ])
    expect(result.type).toBe('Structure Fire')
  })
})

describe('applyTransformationConfigs — aliasing regression', () => {
  it('does not mutate the input dispatch', () => {
    const dispatch = makeDispatch()
    const originalLat = dispatch.location.lat
    applyTransformationConfigs(dispatch, [
      {
        name: 'jitter lat',
        field: 'location.lat',
        strategy: 'random_offset',
        params: { minOffset: 1, maxOffset: 2 },
      },
    ])
    // Nested location must be a deep clone — original untouched.
    expect(dispatch.location.lat).toBe(originalLat)
  })
})

describe('seeded determinism', () => {
  it('random_offset is identical for the same seed, different across seeds', () => {
    const config: FieldTransformationConfig = {
      name: 'offset',
      field: 'location.lat',
      strategy: 'random_offset',
      params: { minOffset: -0.01, maxOffset: 0.01 },
    }
    const a = applyTransformationConfigs(makeDispatch(), [config], {
      random: createSeededRandom(42),
    })
    const b = applyTransformationConfigs(makeDispatch(), [config], {
      random: createSeededRandom(42),
    })
    const c = applyTransformationConfigs(makeDispatch(), [config], {
      random: createSeededRandom(99),
    })
    expect(a.location!.lat).toBe(b.location!.lat)
    expect(a.location!.lat).not.toBe(c.location!.lat)
  })

  it('random_string is identical for the same seed, different across seeds', () => {
    const config: FieldTransformationConfig = {
      name: 'rand',
      field: 'xrefId',
      strategy: 'random_string',
      params: { length: 10, charset: 'alphanumeric' },
    }
    const a = applyTransformationConfigs(makeDispatch(), [config], {
      random: createSeededRandom(7),
    })
    const b = applyTransformationConfigs(makeDispatch(), [config], {
      random: createSeededRandom(7),
    })
    const c = applyTransformationConfigs(makeDispatch(), [config], {
      random: createSeededRandom(8),
    })
    expect(a.xrefId).toBe(b.xrefId)
    expect(a.xrefId).not.toBe(c.xrefId)
    expect(a.xrefId).toHaveLength(10)
  })

  it('hashStringToSeed is stable and produces a valid seed', () => {
    expect(hashStringToSeed('abc')).toBe(hashStringToSeed('abc'))
    expect(hashStringToSeed('abc')).not.toBe(hashStringToSeed('abd'))
  })
})

describe('ruleMatchesDispatch', () => {
  const base = { dispatchTypeRegex: '', keywords: [] as string[], dispatchTypes: [] as string[] }

  it('matches on dispatchType id', () => {
    const dispatch = {
      ...makeDispatch(),
      dispatchType: { _id: 'type_1' },
    } as DispatchWithType
    expect(
      ruleMatchesDispatch({ ...base, dispatchTypes: ['type_1'] }, dispatch)
    ).toBe(true)
    expect(
      ruleMatchesDispatch({ ...base, dispatchTypes: ['type_2'] }, dispatch)
    ).toBe(false)
  })

  it('matches on regex (case-insensitive) against type', () => {
    const dispatch = makeDispatch({ type: 'Structure Fire' })
    expect(
      ruleMatchesDispatch({ ...base, dispatchTypeRegex: 'structure' }, dispatch)
    ).toBe(true)
  })

  it('matches on keyword substring', () => {
    const dispatch = makeDispatch({ type: 'Medical Emergency' })
    expect(
      ruleMatchesDispatch({ ...base, keywords: ['medical'] }, dispatch)
    ).toBe(true)
  })

  it('returns false (not throw) on an invalid regex', () => {
    const dispatch = makeDispatch()
    expect(() =>
      ruleMatchesDispatch({ ...base, dispatchTypeRegex: '([' }, dispatch)
    ).not.toThrow()
    expect(
      ruleMatchesDispatch({ ...base, dispatchTypeRegex: '([' }, dispatch)
    ).toBe(false)
  })

  it('empty regex does not match', () => {
    const dispatch = makeDispatch()
    expect(ruleMatchesDispatch({ ...base, dispatchTypeRegex: '' }, dispatch)).toBe(
      false
    )
  })
})

describe('compileSafeRegex / safeRegexTest', () => {
  it('empty pattern → null regex', () => {
    expect(compileSafeRegex('').regex).toBeNull()
  })
  it('invalid pattern → error, no throw', () => {
    expect(compileSafeRegex('([').regex).toBeNull()
    expect(compileSafeRegex('([').error).toBeTruthy()
  })
  it('safeRegexTest is case-insensitive', () => {
    expect(safeRegexTest('fire', 'Structure FIRE')).toBe(true)
  })
})

describe('validateTransformationConfig', () => {
  it('rejects remove_field on location.lat', () => {
    const errors = validateTransformationConfig({
      name: 'half coord',
      field: 'location.lat',
      strategy: 'remove_field',
      params: {},
    })
    expect(errors.length).toBeGreaterThan(0)
  })

  it('accepts remove_field on whole location', () => {
    expect(
      validateTransformationConfig({
        name: 'ok',
        field: 'location',
        strategy: 'remove_field',
        params: {},
      })
    ).toEqual([])
  })

  it('rejects random_offset missing numeric bounds', () => {
    const errors = validateTransformationConfig({
      name: 'off',
      field: 'location.lat',
      strategy: 'random_offset',
      params: {},
    })
    expect(errors.length).toBeGreaterThan(0)
  })

  it('rejects an unknown strategy', () => {
    const errors = validateTransformationConfig({
      name: 'x',
      field: 'address',
      strategy: 'nope' as FieldTransformationConfig['strategy'],
      params: {},
    })
    expect(errors.length).toBeGreaterThan(0)
  })
})

describe('merge_data template interpolation', () => {
  it('interpolates fields from the dispatch', () => {
    const dispatch = makeDispatch({ city: 'Provo', type: 'Fire' })
    const result = applyTransformationConfigs(dispatch, [
      {
        name: 'merge',
        field: 'address',
        strategy: 'merge_data',
        params: { template: '{city}-{type}' },
      },
    ])
    expect(result.address).toBe('Provo-Fire')
  })

  it('leaves unmatched placeholders in place', () => {
    const dispatch = makeDispatch({ city: 'Provo' })
    const result = applyTransformationConfigs(dispatch, [
      {
        name: 'merge',
        field: 'address',
        strategy: 'merge_data',
        params: { template: '{city}-{missingField}' },
      },
    ])
    expect(result.address).toBe('Provo-{missingField}')
  })
})
