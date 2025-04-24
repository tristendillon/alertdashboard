import { customMutation } from 'convex-helpers/server/customFunctions'
import { TableNames, Doc, type Id } from './_generated/dataModel'
import type { MutationCtx } from './_generated/server'

type ReferentialAction = 'cascade' | 'set_null' | 'restrict'

type ValidFKRefs = {
  [K in TableNames]: {
    [F in keyof Doc<K>]: `${K}.${F & string}`
  }[keyof Doc<K>]
}[TableNames]

type FKReference = {
  fk: ValidFKRefs
  onDelete?: ReferentialAction
}

type Restraint<T extends TableNames> = {
  [K in keyof Doc<T>]?: 'unique' | FKReference
}

// Restraint definition per table
type TableRestraints<T extends TableNames> = {
  [K in keyof Doc<T>]?: 'unique' | FKReference
}

// Restraints for all tables
type Restraints = {
  [K in TableNames]?: Restraint<K>
}

export const userRestraints: TableRestraints<'users'> = {
  email: 'unique',
  role: { fk: 'roles._id', onDelete: 'restrict' },
  organization: { fk: 'organizations._id', onDelete: 'restrict' },
}

export const roleRestraints: TableRestraints<'roles'> = {
  organization: { fk: 'organizations._id', onDelete: 'restrict' },
}

export const departmentRestraints: TableRestraints<'departments'> = {
  organization: { fk: 'organizations._id', onDelete: 'restrict' },
}

export const alertsRestraints: TableRestraints<'alerts'> = {
  department: { fk: 'departments._id', onDelete: 'restrict' },
  organization: { fk: 'organizations._id', onDelete: 'restrict' },
  mappedUnits: { fk: 'units._id', onDelete: 'restrict' },
  mappedDescriptor: { fk: 'descriptors._id', onDelete: 'restrict' },
}

export const dashboardRestraints: TableRestraints<'dashboards'> = {
  station: { fk: 'stations._id', onDelete: 'restrict' },
  department: { fk: 'departments._id', onDelete: 'restrict' },
  alertPage: { fk: 'pages._id', onDelete: 'restrict' },
  dashboardPages: { fk: 'pages._id', onDelete: 'restrict' },
}

export const restraints: Restraints = {
  users: userRestraints,
  roles: roleRestraints,
  departments: departmentRestraints,
  alerts: alertsRestraints,
  dashboards: dashboardRestraints,
}

type MutationType = 'delete' | 'insert'

type Mutation<T extends TableNames> = {
  type: MutationType
  id: Id<T>
  changes?: Partial<Doc<T>>
}

type ReverseFKRef = {
  fromTable: TableNames
  field: string
  onDelete: ReferentialAction
}

function getReferenceMapFor(table: TableNames): ReverseFKRef[] {
  const references: ReverseFKRef[] = []

  for (const [fromTable, tableRestraints] of Object.entries(restraints) as [
    TableNames,
    TableRestraints<TableNames>,
  ][]) {
    for (const [field, value] of Object.entries(tableRestraints ?? {})) {
      if (!value) continue
      if (
        typeof value === 'object' &&
        'fk' in value &&
        value.fk?.startsWith(`${table}.`)
      ) {
        references.push({
          fromTable,
          field,
          onDelete: value.onDelete ?? 'restrict',
        })
      }
    }
  }
  return references
}

type RefDocsResult = {
  status: 'success' | 'error'
} & (
  | { status: 'success'; docs: Doc<any>[]; reason?: never }
  | { status: 'error'; reason: string; docs?: never }
)

export const getRefDocs = async (
  ctx: MutationCtx,
  ref: ReverseFKRef,
  id: Id<any>
): Promise<RefDocsResult> => {
  let refDocs: Doc<any>[] = []
  try {
    refDocs = await ctx.db
      .query(ref.fromTable)
      .withIndex(`by_${ref.field}` as any, (q) => q.eq(ref.field, id))
      .collect()
    console.log('REF DOCS from Index', refDocs)
  } catch (e) {
    const message = (e as any).message
    if (message.includes(`Index ${ref.fromTable}.${ref.field}`)) {
      try {
        const allDocs = await ctx.db.query(ref.fromTable).collect()
        refDocs = allDocs.filter((doc) => {
          const fieldValue = doc[ref.field as keyof typeof doc]
          return fieldValue === id
        })
        console.log('REF DOCS from query and filter', refDocs)
      } catch (e) {
        return {
          status: 'error',
          reason: `Cannot find field ${ref.field} on table ${ref.fromTable}`,
        }
      }
    }
  }
  return {
    status: 'success',
    docs: refDocs,
  }
}

type CanMutateResult = {
  allowed: boolean
} & ({ allowed: true; reason?: never } | { allowed: false; reason: string })

export const canMutate = async (
  mutation: {
    type: MutationType
    table: TableNames
    id: Id<TableNames>
  },
  ctx: MutationCtx
): Promise<CanMutateResult> => {
  const { type, table, id } = mutation
  if (type !== 'delete') {
    return { allowed: true }
  }

  const references = getReferenceMapFor(table)
  console.log('REFERENCES', references)
  for (const ref of references) {
    const refDocsResult = await getRefDocs(ctx, ref, id)
    if (refDocsResult.status === 'error') {
      return {
        allowed: false,
        reason: refDocsResult.reason,
      }
    }
    const refDocs = refDocsResult.docs
    if (ref.onDelete === 'restrict' && refDocs.length > 0) {
      return {
        allowed: false,
        reason: `Cannot delete from '${table}' because '${ref.fromTable}.${ref.field}' has a 'restrict' onDelete restraint.`,
      }
    }
  }

  return { allowed: true }
}
