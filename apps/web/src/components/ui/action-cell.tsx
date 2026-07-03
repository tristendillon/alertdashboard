"use client";

import * as React from "react";
import { MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { Cell, type CellProps } from "./cell";
import { useModalState } from "@/hooks/nuqs/use-modal-state";
import { useQueryState } from "nuqs";
import type { Modals } from "@/lib/enums";

interface ActionCellProps extends Omit<CellProps, "variant" | "asChild"> {
  modalType: Modals; // e.g., Modals.HYDRANT, Modals.DISPATCH_TYPE
  itemId: string;
  onDelete?: () => void;
}

export function ActionCell({
  modalType,
  itemId,
  onDelete,
  className,
  ...props
}: ActionCellProps) {
  const [, setModal] = useModalState();
  const [, setId] = useQueryState("id", { clearOnDefault: true });
  const [, setAction] = useQueryState("action", { clearOnDefault: true });

  const handleView = () => {
    setModal(modalType);
    setId(itemId);
    setAction("view");
  };

  const handleEdit = () => {
    setModal(modalType);
    setId(itemId);
    setAction("edit");
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    } else {
      setModal(modalType);
      setId(itemId);
      setAction("delete");
    }
  };

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
          <DropdownMenuItem onClick={handleView} className="cursor-pointer">
            <Eye className="mr-2 h-4 w-4" />
            View
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleEdit} className="cursor-pointer">
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={handleDelete} 
            className="cursor-pointer text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Cell>
  );
}