import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarTransition,
  SidebarTriggerWithModifierKey,
} from "@workspace/ui/components/sidebar"
import { RenderSidebarMenu } from "./render-sidebar-menu"
import Link from 'next/link'
import { ArrowLeftIcon } from "lucide-react"


import { type Sidebar as SidebarType } from "@workspace/ui/lib/types"
import { AllSidebars } from "./lib"

interface AppSidebarProps {
  sidebar: SidebarType
}

export function AppSidebar({ sidebar: { groups, parent } }: AppSidebarProps) {

  const firstGroup = groups[0]
  const otherGroups = groups.slice(1)

  return (
    <Sidebar collapsible="icon" className="overflow-y-auto bg-sidebar">
      <SidebarTransition hasParent={!!parent} sidebars={AllSidebars}>
        <SidebarContent className="border-none h-full">

          {/* Manual First Group for defining the close trigger */}
          <SidebarGroup className="overflow-x-hidden text-nowrap">
            <SidebarGroupLabel className="group-data-[collapsible=icon]:mb-4">
              <div className="flex items-center w-full h-full justify-between">
                <span className={`group-data-[animated-closed=true]/sidebar-wrapper:hidden group-data-[collapsible=icon]:opacity-0 text-nowrap transition-all duration-200 ease-linear group-data-[collapsible=icon]:-ml-[4rem]`}>
                  {/* Full path Href is required because how NextJS Layouts work */}
                  {parent ? (
                    <Link href={`/${parent.href}`} className="flex items-center gap-2">
                      <ArrowLeftIcon className="w-4 h-4" />
                      <span className="truncate w-[8rem]">
                        {parent.label} / {firstGroup.label}
                      </span>
                    </Link>
                  ) : (
                    firstGroup.label
                  )}
                </span>
                <SidebarTriggerWithModifierKey />
              </div>
            </SidebarGroupLabel>

            <SidebarGroupContent>
              <RenderSidebarMenu items={firstGroup.items} />
            </SidebarGroupContent>
          </SidebarGroup>

          {
            otherGroups.map((group) => (
              <SidebarGroup className="overflow-x-hidden text-nowrap" key={group.label}>
                <SidebarGroupLabel hideOnClose>
                  {group.label}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <RenderSidebarMenu items={group.items} />
                </SidebarGroupContent>
              </SidebarGroup>
            ))
          }
        </SidebarContent>
      </SidebarTransition>
    </Sidebar>
  )
}