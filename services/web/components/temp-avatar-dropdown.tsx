'use client'

import React from 'react'
import { Avatar, AvatarImage, AvatarFallback } from "@workspace/ui/components/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { LogOut, User, Settings } from "lucide-react"
import { useAuthActions } from "@convex-dev/auth/react";
import { useUser } from '@workspace/ui/providers/user-provider'

export default function TempAvatarDropdown() {
  const { signOut } = useAuthActions();
  // If undefined user is loading.
  const user = useUser();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={!user}>
        {!user ? (
          <div className="size-10 rounded-full bg-muted animate-pulse"></div>
        ) : (
          <Avatar className="size-10 cursor-pointer hover:opacity-80 transition-opacity">
            <AvatarImage src={user.image} />
            <AvatarFallback>{user.firstName?.[0]}{user.lastName?.[0]}</AvatarFallback>
          </Avatar>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 border-border" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
