import { useCallback, useRef } from "react";

// Type for setState function (React.Dispatch<React.SetStateAction<T>>)
type SetStateFunction<T> = (value: T | ((prevState: T) => T)) => void;

// Type for regular function
type RegularFunction<TArgs extends unknown[], TReturn> = (
  ...args: TArgs
) => TReturn;

// Overload for setState function
function useDebounce<T>(
  fn: SetStateFunction<T>,
  delay: number,
): SetStateFunction<T>;

// Overload for regular function
function useDebounce<TArgs extends unknown[], TReturn>(
  fn: RegularFunction<TArgs, TReturn>,
  delay: number,
): RegularFunction<TArgs, void>;

// Implementation
function useDebounce<T, TArgs extends unknown[], TReturn>(
  fn: SetStateFunction<T> | RegularFunction<TArgs, TReturn>,
  delay: number,
): SetStateFunction<T> | RegularFunction<TArgs, void> {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedFn = useCallback(
    (...args: TArgs) => {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        (fn as RegularFunction<TArgs, TReturn>)(...args);
      }, delay);
    },
    [fn, delay],
  );

  return debouncedFn;
}

export default useDebounce;

// Usage Examples:
/*
// Example 1: With setState function
const [searchTerm, setSearchTerm] = useState('');
const debouncedSetSearchTerm = useDebounce(setSearchTerm, 300);

// Usage: debouncedSetSearchTerm('new value') or debouncedSetSearchTerm(prev => prev + 'new')

// Example 2: With regular function
const handleSearch = (query: string, filters: { category: string }) => {
  console.log('Searching for:', query, 'with filters:', filters);
};
const debouncedHandleSearch = useDebounce(handleSearch, 500);

// Usage: debouncedHandleSearch('query', { category: 'books' })

// Example 3: With async function
const fetchData = async (id: number) => {
  const response = await fetch(`/api/data/${id}`);
  return response.json();
};
const debouncedFetchData = useDebounce(fetchData, 300);

// Usage: debouncedFetchData(123)
*/
