"use client"


import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  useSidebar,
} from "@workspace/ui/components/sidebar"



import Link from 'next/link'
import { ExpandableContent, ExpandableTrigger, Expandable } from "@workspace/ui/components/expandable"
import { SidebarMenuItem as SidebarMenuItemType } from '@workspace/ui/lib/types'

interface RenderSidebarMenuProps {
  items: SidebarMenuItemType[]
}
export function RenderSidebarMenu({ items }: RenderSidebarMenuProps) {
  return (
    <SidebarMenu>
      {items.map((item) => (
        <RenderSidebarMenuItem key={"label" in item ? item.label : item.title} item={item} />
      ))}
    </SidebarMenu>
  );
}

interface RenderSidebarMenuItemProps {
  item: SidebarMenuItemType
}

function RenderSidebarMenuItem({ item }: RenderSidebarMenuItemProps) {
  const {
    open
  } = useSidebar()
  if ("items" in item) {
    return (
      <Expandable closed={!open} className="group/expandable">
        <SidebarMenuItem>
          <ExpandableTrigger asChild>
            <SidebarMenuButton className="text-nowrap h-12">
              {item.icon}
              {item.label}
            </SidebarMenuButton>
          </ExpandableTrigger>
          <ExpandableContent>
            <SidebarMenuSub className="mx-0">
              {item.items.map((subItem) => (
                <RenderSidebarMenuItem
                  key={"label" in subItem ? subItem.label : subItem.title}
                  item={subItem}
                />
              ))}
            </SidebarMenuSub>
          </ExpandableContent>
        </SidebarMenuItem>
      </Expandable>
    );
  } else {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <Link href={`/${item.url}`} className="text-nowrap h-12">
            {item.icon}
            {item.title}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }
}
