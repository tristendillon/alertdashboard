import { Doc, TableNames } from '@workspace/convex/app/_generated/dataModel'

import { SVGProps } from 'react'

// Type definitions for our icon components
export type IconProps = {
  size?: number
  color?: string
} & Omit<SVGProps<SVGSVGElement>, 'width' | 'height' | 'color'>

export type JoinField<K extends string, T extends TableNames> = {
  [P in K]: Doc<T>
}

export type OptionalJoinField<K extends string, T extends TableNames> = {
  [P in K]?: Doc<T>
}

export type JoinedUser = Doc<'users'> & OptionalJoinField<'joinedRole', 'roles'>

export type Sidebar = {
  key: string
  pathnames: string[]
  groups: [SidebarGroup, ...SidebarGroup[]]
  parent?: {
    label: string
    href: string
  }
}

export type SidebarGroup = {
  label: string
  icon?: React.ReactNode
  items: SidebarMenuItem[]
}

export type SidebarMenuItem =
  | {
      label: string
      icon: React.ReactNode
      items: SidebarMenuItem[]
    }
  | {
      title: string
      url: string
      icon: React.ReactNode
      isChildLink?: boolean
    }
