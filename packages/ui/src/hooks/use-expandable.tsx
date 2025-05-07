import { useState, useCallback } from 'react'
import { useSpring } from 'motion/react'

export function useExpandable(initialState = false, open?: boolean, onOpenChange?: (open: boolean) => void, closed?: boolean) {
  const [internalExpanded, setInternalExpanded] = useState(initialState)

  // Use controlled state if provided, otherwise use internal state
  // If closed is true, always return false regardless of other states
  const isExpanded = closed ? false : (open !== undefined ? open : internalExpanded)

  const springConfig = { stiffness: 300, damping: 30 }
  const animatedHeight = useSpring(0, springConfig)

  const toggleExpand = useCallback(() => {
    // If closed is true, don't allow toggling
    if (closed) return

    const newState = !isExpanded

    if (open === undefined) {
      setInternalExpanded(newState)
    }

    onOpenChange?.(newState)
  }, [isExpanded, open, onOpenChange, closed])

  return { isExpanded, toggleExpand, animatedHeight }
}
