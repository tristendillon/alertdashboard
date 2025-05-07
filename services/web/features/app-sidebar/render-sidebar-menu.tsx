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

import { AllSidebars } from "./lib"
import { ChevronRightIcon } from 'lucide-react'
import { Button } from '@workspace/ui/components/button'
import { useCallback, useEffect, useState } from 'react'

const CHILD_SIDEBAR_EXPANDED_COOKIE_NAME = "child-sidebar-expanded"
const CHILD_SIDEBAR_EXPANDED_COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 1 week

function getChildSidebarExpandedCookie(key: string) {
  const match = document.cookie.match(new RegExp('(^| )' + CHILD_SIDEBAR_EXPANDED_COOKIE_NAME + '-' + key + '=([^;]+)'))
  if (match) {
    return match[2] === 'true'
  }
  return false
}

function RenderSidebarMenuItem({ item }: RenderSidebarMenuItemProps) {
  const { open } = useSidebar()
  const [expanded, setExpanded] = useState(false)
  const isChildLink = "isChildLink" in item && item.isChildLink
  const childSidebar = isChildLink ? AllSidebars.find((sidebar) => sidebar.pathnames.includes(item.url)) : null

  const toggleExpanded = useCallback(() => {
    if (childSidebar) {
      setExpanded(prev => {
        document.cookie = `${CHILD_SIDEBAR_EXPANDED_COOKIE_NAME}-${childSidebar.key}=${!prev}; path=/; max-age=${CHILD_SIDEBAR_EXPANDED_COOKIE_MAX_AGE}`
        return !prev
      })
    }
  }, [expanded, childSidebar])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const expanded = getChildSidebarExpandedCookie(childSidebar?.key as string)
      setExpanded(expanded)
    }
  }, [childSidebar])


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
  }



  if (childSidebar) {
    console.log("Expanded", expanded)
    return (
      <Expandable closed={!open} open={expanded} onOpenChange={toggleExpanded}>
        <SidebarMenuItem>
          <div className="flex items-center justify-between">
            <SidebarMenuButton asChild>
              <Link href={`/${item.url}`} className="text-nowrap h-12 flex items-center gap-2 w-full">
                {item.icon}
                {item.title}
              </Link>
            </SidebarMenuButton>
            {/* <ExpandableTrigger asChild className="group-data-[animated-closed=true]/sidebar-wrapper:hidden"> */}
            <Button variant="ghost" size="icon" onClick={toggleExpanded} className="group-data-[animated-closed=true]/sidebar-wrapper:hidden">
              <ChevronRightIcon className="w-4 h-4 transition-transform duration-200 ease-linear group-data-[expanded=true]/expandable:rotate-90" />
            </Button>
            {/* </ExpandableTrigger> */}
          </div>
          <ExpandableContent>
            <SidebarMenuSub className="mx-0">
              {childSidebar.groups.flatMap(group =>
                group.items.map((subItem) => (
                  <RenderSidebarMenuItem
                    key={"label" in subItem ? subItem.label : subItem.title}
                    item={subItem}
                  />
                ))
              )}
            </SidebarMenuSub>
          </ExpandableContent>
        </SidebarMenuItem>
      </Expandable>
    );
  }

  // Regular menu item without children
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
