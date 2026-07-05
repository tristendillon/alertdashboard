"use client";

import Link from "next/link";
import { Edit, MoreHorizontal, Trash2 } from "lucide-react";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { Cell, type CellProps } from "./cell";
import { useDrawerState } from "@/hooks/nuqs/use-drawer-state";
import { DrawerMode, type DrawerEntity } from "@/lib/enums";

interface ActionCellProps extends Omit<CellProps, "variant" | "asChild"> {
  entity: DrawerEntity;
  itemId: string;
  /**
   * When set, the Edit item navigates to this route (full-page editor) instead
   * of opening the drawer in EDIT mode. Delete keeps using the drawer flow.
   */
  editHref?: string;
}

export function ActionCell({
  entity,
  itemId,
  editHref,
  className,
  ...props
}: ActionCellProps) {
  const { open } = useDrawerState();

  return (
    <Cell variant="default" className={className} {...props}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            aria-label="Open actions menu"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          {editHref ? (
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href={editHref}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={() => open(entity, DrawerMode.EDIT, itemId)}
              className="cursor-pointer"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => open(entity, DrawerMode.DELETE, itemId)}
            className="text-destructive focus:text-destructive cursor-pointer"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Cell>
  );
}
