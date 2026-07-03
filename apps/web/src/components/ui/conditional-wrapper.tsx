interface ConditionalWrapperProps<T> {
  condition: T;
  wrapper: (
    children: React.ReactNode,
    value: NonNullable<T>,
  ) => React.ReactNode;
  elseWrapper?: (children: React.ReactNode) => React.ReactNode;
  children: React.ReactNode;
}

/**
 * Conditionally wraps children with different wrapper components based on a condition
 * The wrapper function receives the non-null value when condition is truthy
 *
 * @example
 * <ConditionalWrapper
 *   condition={dispatch}
 *   wrapper={(children, dispatch) => (
 *     <PopoverMap dispatch={dispatch}>
 *       {children}
 *     </PopoverMap>
 *   )}
 * >
 *   <span>Content to wrap</span>
 * </ConditionalWrapper>
 */
export function ConditionalWrapper<T>({
  condition,
  wrapper,
  elseWrapper,
  children,
}: ConditionalWrapperProps<T>) {
  if (condition) {
    return wrapper(children, condition);
  }

  if (elseWrapper) {
    return elseWrapper(children);
  }

  return children;
}
