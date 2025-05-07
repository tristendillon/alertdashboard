'use client'

import { useExpandable } from '@workspace/ui/hooks/use-expandable'
import { motion } from 'motion/react'
import { useRef, useEffect, createContext, useContext, useState } from 'react'
import { cn } from '@workspace/ui/lib/utils'
import { Slot } from '@radix-ui/react-slot'
// import { ChevronDownIcon } from 'lucide-react'

const ExpandableContext = createContext<ReturnType<
  typeof useExpandable
> | null>(null)

interface ExpandableProps {
  children: React.ReactNode
  defaultExpanded?: boolean
  className?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  closed?: boolean
}

export function Expandable({
  children,
  defaultExpanded = false,
  className,
  open,
  onOpenChange,
  closed,
}: ExpandableProps) {
  const expandableState = useExpandable(defaultExpanded, open, onOpenChange, closed)

  return (
    <ExpandableContext.Provider value={expandableState}>
      <div className={cn('flex flex-col', className)}>{children}</div>
    </ExpandableContext.Provider>
  )
}

// interface ExpandableLabelProps {
//   children: React.ReactNode
//   className?: string
//   arrowVisible?: boolean
//   side?: 'left' | 'right'
// }

interface ExpandableTriggerProps {
  children: React.ReactNode
  className?: string
  asChild?: boolean
}

export function ExpandableTrigger({
  children,
  className,
  asChild,
}: ExpandableTriggerProps) {
  const context = useContext(ExpandableContext)
  if (!context)
    throw new Error('ExpandableLabel must be used within Expandable')

  const { isExpanded, toggleExpand } = context

  const Comp = asChild ? Slot : "div"

  return (
    <Comp
      onClick={toggleExpand}
      data-expanded={isExpanded}
      className={cn('group flex items-center gap-2', className)}
    >
      {children}
    </Comp>
  )
}
export function ExpandableContent({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const [isTransitioning, setIsTransitioning] = useState(false)
  const context = useContext(ExpandableContext)
  if (!context)
    throw new Error('ExpandableContent must be used within Expandable')

  const contentRef = useRef<HTMLDivElement>(null)
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { isExpanded, animatedHeight } = context

  useEffect(() => {
    // Start transition when expanded state changes
    setIsTransitioning(true)

    if (contentRef.current) {
      animatedHeight.set(isExpanded ? contentRef.current.offsetHeight : 0)
    }

    // Clear any existing timeout
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current)
    }

    // Set timeout to mark transition as complete
    // Adjust the timeout duration to match your CSS transition duration
    transitionTimeoutRef.current = setTimeout(() => {
      setIsTransitioning(false)
    }, 1000)

    // Cleanup timeout on unmount or when effect runs again
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current)
      }
    }
  }, [isExpanded, animatedHeight])

  // Use height: auto/100% when expanded and not transitioning
  const heightStyle = (isExpanded && !isTransitioning)
    ? "100%"
    : animatedHeight

  return (
    <motion.div
      style={{
        height: heightStyle,
      }}
      className="overflow-hidden"
    >
      <div ref={contentRef} className={cn('pl-6', className)}>
        {children}
      </div>
    </motion.div>
  )
}