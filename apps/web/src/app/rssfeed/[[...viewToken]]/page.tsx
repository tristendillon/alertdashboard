import { ViewTokenProvider } from "@/providers/view-providers";
import { DispatchesProvider } from "@/providers/dispatches-provider";
import { DispatchList } from "@/components/dispatch-list";
import { getTokenIdFromParams } from "@/utils/server-only";

interface RSSFeedViewTokenPageProps {
  params: Promise<{
    viewToken: string[];
  }>;
}
export default async function RSSFeedViewTokenPage({
  params,
}: RSSFeedViewTokenPageProps) {
  const { data: tokenId, error } = await getTokenIdFromParams(params);

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <ViewTokenProvider tokenId={tokenId}>
      <DispatchesProvider>
        <div className="flex h-screen w-screen flex-col overflow-hidden">
          {/* <Header /> */}
          <main className="flex-1 overflow-hidden">
            <div className="container mx-auto h-full">
              <DispatchList />
            </div>
          </main>
        </div>
      </DispatchesProvider>
    </ViewTokenProvider>
  );
}
