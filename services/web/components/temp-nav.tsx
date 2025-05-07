'use client'

import React from 'react'
import TempAvatarDropdown from './temp-avatar-dropdown'
import Link from 'next/link'

export default function TempNav() {
  return (
    <header className="w-full h-16 border-b border-border flex items-center justify-between px-10">
      <Link href={"/"} className="font-bold text-3xl">AlertDashboard</Link>
      <TempAvatarDropdown />
    </header>
  )
}
