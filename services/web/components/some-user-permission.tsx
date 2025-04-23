"use client"

import React from 'react'
import { useHasPermission } from "@workspace/ui/hooks/use-has-permission"

export default function SomeUserPermission() {
  const {hasPermission, hasPermissionLoading} = useHasPermission(["admin:all"])


  if (hasPermissionLoading) {
    return (
      <div>Loading</div>
    )
  }

  return (
    <div>
      {hasPermission ? "Has Permission" : "No Permission"}
    </div>
  )
}