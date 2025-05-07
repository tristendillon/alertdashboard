'use client'

import { useEffect, useState } from 'react'

type ModifierKey = 'Meta' | 'Control'

export function usePlatformModifierKey(): ModifierKey {
  const [modifierKey, setModifierKey] = useState<ModifierKey>('Control')

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase()
    const isMac =
      userAgent.includes('mac') ||
      userAgent.includes('iphone') ||
      userAgent.includes('ipad')
    setModifierKey(isMac ? 'Meta' : 'Control')
  }, [])

  return modifierKey
}
