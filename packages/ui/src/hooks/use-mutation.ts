import { useConvexMutation } from "@convex-dev/react-query";
import { UseMutationResult } from "@tanstack/react-query";
import { FunctionReference } from "convex/server";
import { useMutation as useTanstackMutation } from "@tanstack/react-query";

export function useMutation<Query extends FunctionReference<'mutation'>>(
  query: Query,
): UseMutationResult< {
  data: Query['_returnType'];
  isLoading: boolean;
}> {
  const result = useTanstackMutation({
    mutationFn: useConvexMutation(query)
  });
  return result;
}