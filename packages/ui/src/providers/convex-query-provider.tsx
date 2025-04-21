"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConvexQueryClient } from "@convex-dev/react-query";
import { ConvexReactClient } from "convex/react";
import { ConvexQueryCacheProvider } from "convex-helpers/react/cache/provider";
import { ConvexAuthNextjsProvider } from "@convex-dev/auth/nextjs";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const convexQueryClient = new ConvexQueryClient(convex);

interface TCQueryProviderProps {
  children: React.ReactNode;
 }


export function TCQueryProvider({
  children,
}: TCQueryProviderProps){

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        queryKeyHashFn: convexQueryClient.hashFn(),
        queryFn: convexQueryClient.queryFn(),
      },
    },
  });
  return (
    <ConvexAuthNextjsProvider  client={convex}>
      <QueryClientProvider client={queryClient}>
        <ConvexQueryCacheProvider>
          {children}
        </ConvexQueryCacheProvider>
      </QueryClientProvider>
    </ConvexAuthNextjsProvider>
  )
}