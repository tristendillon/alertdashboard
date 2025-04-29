import { Doc, TableNames } from '@workspace/convex/app/_generated/dataModel'

export type JoinField<K extends string, T extends TableNames> = {
  [P in K]: Doc<T>
}

export type OptionalJoinField<K extends string, T extends TableNames> = {
  [P in K]?: Doc<T>
}

export type JoinedUser = Doc<'users'> & OptionalJoinField<'joinedRole', 'roles'>
