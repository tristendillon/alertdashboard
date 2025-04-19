import Chat from "@/components/chat";

interface PageProps {
  searchParams: Promise<{ author: string }>;
}

export default async function Home({searchParams}: PageProps) {
  const { author } = await searchParams
  return (
   <div className="h-full">
    <Chat author={author} />
   </div>
  );
}
