"use client";

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
}

export function ActionCell({
  entity,
  itemId,
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
          <DropdownMenuItem
            onClick={() => open(entity, DrawerMode.EDIT, itemId)}
            className="cursor-pointer"
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
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
