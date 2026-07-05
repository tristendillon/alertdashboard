import type { DispatchWithType, TransformedDispatch } from '../api/schema'
import type { QueryCtx } from '../api/_generated/server'
import type { Id } from '../api/_generated/dataModel'
import {
  applyTransformationConfigs,
  ruleMatchesDispatch,
  type FieldTransformationConfig,
} from './transform/core'

// Main transformation engine. Kept as `TransformationEngine.transformDispatches`
// with the same signature so callers (dispatches.ts) need no import change.
//
// Read-time only: transformations are never persisted. All heavy lifting lives
// in the pure, web-safe core (./transform/core); this class is just the Convex
// data-access glue.
export class TransformationEngine {
  static async transformDispatches(
    dispatches: DispatchWithType[],
    ctx: QueryCtx
  ): Promise<TransformedDispatch[]> {
    // undefined counts as enabled so rules created before the flag existed
    // keep applying.
    const rules = (
      await ctx.db.query('transformationRules').collect()
    ).filter((rule) => rule.enabled !== false)

    if (rules.length === 0) {
      // Still deep-clone-free: nothing matches, return dispatches unchanged.
      return dispatches
    }

    // Resolve every referenced transformation doc ONCE into a Map, rather than
    // re-fetching per dispatch (the old per-dispatch, per-id ctx.db.get).
    const referencedIds = new Set<Id<'fieldTransformations'>>()
    for (const rule of rules) {
      for (const id of rule.transformations) referencedIds.add(id)
    }

    const configById = new Map<
      Id<'fieldTransformations'>,
      FieldTransformationConfig
    >()
    await Promise.all(
      [...referencedIds].map(async (id) => {
        const doc = await ctx.db.get(id)
        if (doc) {
          configById.set(id, {
            name: doc.name,
            field: doc.field,
            strategy: doc.strategy,
            params: doc.params,
          })
        }
      })
    )

    return dispatches.map((dispatch) => {
      // Collect ordered configs from every matching rule.
      const configs: FieldTransformationConfig[] = []
      for (const rule of rules) {
        if (
          !ruleMatchesDispatch(
            {
              dispatchTypeRegex: rule.dispatchTypeRegex,
              keywords: rule.keywords,
              dispatchTypes: rule.dispatchTypes,
            },
            dispatch
          )
        ) {
          continue
        }
        for (const id of rule.transformations) {
          const config = configById.get(id)
          if (config) configs.push(config)
        }
      }

      if (configs.length === 0) return dispatch
      // No `random` passed → Math.random, preserving public behavior.
      return applyTransformationConfigs(dispatch, configs)
    })
  }
}
