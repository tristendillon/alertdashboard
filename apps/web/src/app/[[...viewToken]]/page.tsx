import { ViewTokenProvider } from "@/providers/view-providers";
import { ResponsiveLayout } from "@/components/responsive-layout";
import { Header } from "@/components/ui/header";
import { ActiveDispatchProvider } from "@/providers/active-dispatch-provider";
import { DispatchesProvider } from "@/providers/dispatches-provider";
import { WeatherProvider } from "@/providers/weather-provider";
import { getTokenIdFromParams } from "@/utils/server-only";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

interface ViewTokenPageProps {
  params: Promise<{
    viewToken: string[];
  }>;
}

const getIframeStatus = async () => {
  const h = await headers();
  const fetchDest = h.get("sec-fetch-dest");
  const isIframe = fetchDest === "iframe";

  return {
    isIframe,
  };
};

export default async function ViewTokenPage({ params }: ViewTokenPageProps) {
  const { isIframe } = await getIframeStatus();
  const { data: tokenId, error } = await getTokenIdFromParams(params);

  if (error) {
    return notFound();
  }

  return (
    <ViewTokenProvider tokenId={tokenId}>
      <WeatherProvider>
        <DispatchesProvider>
          <ActiveDispatchProvider>
            <div className="flex h-screen w-screen flex-col overflow-hidden">
              <Header isIframe={isIframe} />
              <ResponsiveLayout />
            </div>
          </ActiveDispatchProvider>
        </DispatchesProvider>
      </WeatherProvider>
    </ViewTokenProvider>
  );
}
