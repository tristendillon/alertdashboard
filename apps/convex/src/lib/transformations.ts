import type {
  DispatchWithType,
  FieldTransformation,
  TransformationRule,
} from '../api/schema'
import type { QueryCtx } from '../api/_generated/server'

function setNestedValue(obj: any, path: string, value: any): void {
  const keys = path.split('.')
  const lastKey = keys.pop()!
  const target = keys.reduce((current, key) => {
    if (!(key in current)) current[key] = {}
    return current[key]
  }, obj)
  target[lastKey] = value
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

// Base transformer class for all transformation strategies
export abstract class DataTransformer {
  constructor(protected config: FieldTransformation) {}

  abstract transform(value: any, dispatch: DispatchWithType): any

  // Helper to safely get nested field values
  // Helper to safely set nested field values
}

// Static value transformer - sets field to a specific value (redaction)
export class StaticValueTransformer extends DataTransformer {
  transform(): any {
    return this.config.params.value
  }
}

// Random offset transformer - adds random offset within range
export class RandomOffsetTransformer extends DataTransformer {
  transform(value: any): any {
    if (typeof value !== 'number') return value

    const { minOffset, maxOffset } = this.config.params
    const randomOffset = Math.random() * (maxOffset - minOffset) + minOffset
    return value + randomOffset
  }
}

// Random string transformer - generates random string
export class RandomStringTransformer extends DataTransformer {
  transform(): any {
    const { length = 8, charset = 'alphanumeric' } = this.config.params

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
      () => chars[Math.floor(Math.random() * chars.length)]
    ).join('')
  }
}

// Merge data transformer - combines data from other fields
export class MergeDataTransformer extends DataTransformer {
  transform(value: any, dispatch: DispatchWithType): any {
    const { sourceFields, template, separator = '-' } = this.config.params

    if (template) {
      // Template-based merging: "{city}-{type}"
      return template.replace(
        /\{(\w+(?:\.\w+)*)\}/g,
        (match: string, fieldPath: string) => {
          return getNestedValue(dispatch, fieldPath) || match
        }
      )
    } else if (sourceFields) {
      // Simple concatenation with separator
      return sourceFields
        .map((field: string) => getNestedValue(dispatch, field))
        .filter(Boolean)
        .join(separator)
    }

    return value
  }
}

// Factory for creating transformers
export class TransformerFactory {
  static create(config: FieldTransformation): DataTransformer {
    switch (config.strategy) {
      case 'static_value':
        return new StaticValueTransformer(config)
      case 'random_offset':
        return new RandomOffsetTransformer(config)
      case 'random_string':
        return new RandomStringTransformer(config)
      case 'merge_data':
        return new MergeDataTransformer(config)
      default:
        throw new Error(`Unknown transformation strategy`)
    }
  }
}

// Transformation matcher - determines which rules apply to a dispatch
export class TransformationMatcher {
  static async getMatchingRules(
    dispatch: DispatchWithType,
    ctx: QueryCtx,
    allRules: TransformationRule[]
  ): Promise<TransformationRule[]> {
    const dispatchType = dispatch.dispatchType
      ? await ctx.db.get(dispatch.dispatchType._id)
      : null
    const type = dispatch.type.toLowerCase()

    return allRules.filter((rule) => {
      // Check exact dispatch type match
      if (dispatchType && rule.dispatchTypes.includes(dispatchType._id)) {
        return true
      }

      // Check regex match
      if (
        rule.dispatchTypeRegex &&
        type.match(new RegExp(rule.dispatchTypeRegex, 'i'))
      ) {
        return true
      }

      // Check keyword match
      return rule.keywords.some((keyword) =>
        type.includes(keyword.toLowerCase())
      )
    })
  }
}

// Transformation applier - applies transformations to dispatch data
export class TransformationApplier {
  static async applyTransformations(
    dispatch: DispatchWithType,
    ctx: QueryCtx,
    transformationIds: string[]
  ): Promise<DispatchWithType> {
    // Get all transformation configs
    const transformations = await Promise.all(
      transformationIds.map((id) => ctx.db.get(id as any))
    )

    // Filter out any null results and create a copy to transform
    const validTransformations = transformations.filter(
      Boolean
    ) as FieldTransformation[]
    const transformedDispatch = { ...dispatch }

    // Apply each transformation
    for (const transformation of validTransformations) {
      const transformer = TransformerFactory.create(transformation)
      const currentValue = getNestedValue(
        transformedDispatch,
        transformation.field
      )
      const newValue = transformer.transform(currentValue, transformedDispatch)
      setNestedValue(transformedDispatch, transformation.field, newValue)
    }

    return transformedDispatch
  }
}

// Main transformation engine
export class TransformationEngine {
  static async transformDispatches(
    dispatches: DispatchWithType[],
    ctx: QueryCtx
  ): Promise<DispatchWithType[]> {
    const allRules = await ctx.db.query('transformationRules').collect()

    return await Promise.all(
      dispatches.map(async (dispatch) => {
        const matchingRules = await TransformationMatcher.getMatchingRules(
          dispatch,
          ctx,
          allRules
        )

        if (matchingRules.length === 0) {
          return dispatch
        }

        // Collect all transformation IDs from matching rules
        const transformationIds = matchingRules.flatMap(
          (rule) => rule.transformations
        )

        // Apply transformations
        return await TransformationApplier.applyTransformations(
          dispatch,
          ctx,
          transformationIds
        )
      })
    )
  }
}
