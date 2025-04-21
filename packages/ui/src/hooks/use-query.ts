import { useQueries } from 'convex-helpers/react/cache/hooks';
import { OptionalRestArgsOrSkip, useConvex } from 'convex/react';
import { FunctionReference, FunctionReturnType, getFunctionName } from 'convex/server';
import { EmptyObject } from 'node_modules/convex/dist/esm-types/server/registration.js';
import { useMemo } from 'react';

export const useQuery = makeUseQueryWithStatus(useQueries);

export function useQueryCallback<Query extends FunctionReference<"query">>(query: Query) {
  const convex = useConvex();

  return async (args?: OptionalRestArgsOrSkip<Query>[0]) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-any
    return await convex.query(query, args as any);
  };
};

type UseQueryResult<Query extends FunctionReference<"query">> =
  | {
      status: "success";
      data: NonNullable<FunctionReturnType<Query>>;
      error: undefined;
      isSuccess: true;
      isPending: false;
      isError: false;
    }
  | {
      status: "error";
      data: undefined;
      error: Error;
      isSuccess: false;
      isPending: false;
      isError: true;
    }
  | {
      status: "pending";
      data: undefined;
      error: undefined;
      isSuccess: false;
      isPending: true;
      isError: false;
    };

function makeUseQueryWithStatus(useQueriesHook: typeof useQueries) {
  return function useQuery<Query extends FunctionReference<"query">>(
    query: Query,
    ...queryArgs: OptionalRestArgsOrSkip<Query>
  ): UseQueryResult<Query> {
    const args = queryArgs[0] ?? {};
    const queries = useMemo(() => {
      if (args === "skip") {
        return {} as EmptyObject;
      }
      return {
        data: {
          query,
          args,
        },
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [getFunctionName(query), JSON.stringify(args)]);

    const result = useQueriesHook(queries);

    if (args === "skip") {
      return {
        status: "pending",
        data: undefined,
        error: undefined,
        isSuccess: false,
        isPending: true,
        isError: false,
      };
    }

    if (result.data instanceof Error) {
      return {
        status: "error",
        data: undefined,
        error: result.data,
        isSuccess: false,
        isPending: false,
        isError: true,
      };
    }

    const { data } = result;

    if (data === undefined) {
      return {
        status: "pending",
        data,
        error: undefined,
        isSuccess: false,
        isPending: true,
        isError: false,
      };
    }

    return {
      status: "success",
      data,
      error: undefined,
      isSuccess: true,
      isPending: false,
      isError: false,
    };
  };
}
