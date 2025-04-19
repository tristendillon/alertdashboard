'use client'

import { useMutation } from "@workspace/ui/hooks/use-mutation"
import { useQuery } from "@workspace/ui/hooks/use-query"
import { api } from "@workspace/convex/app/_generated/api"

import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import React, { useRef, useState, useEffect } from "react";
import { cn } from "@workspace/ui/lib/utils";

export default function Chat({author}: {author: string}) {
  const { data, isPending, error} = useQuery(api.messages.list);
  const sendMessage = useMutation(api.messages.send);

  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    await sendMessage.mutateAsync({ text: message, author });
    setMessage("");
  };

  return (
    <div className="flex flex-col h-full max-w-2xl border border-border rounded-lg overflow-hidden bg-card shadow-sm container mx-auto">
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 chat-scroll">
        {isPending && <p className="text-center text-muted-foreground">Loading...</p>}
        {error && <p className="text-center text-destructive">Error: {error.message}</p>}
        {data && data.length === 0 && <p className="text-center text-muted-foreground">No messages yet.</p>}
        {data && data.map((msg) => (
          <div
            key={msg._id}
            className={cn(
              "px-4 py-2 rounded-2xl max-w-[80%] break-words",
              msg.author === author
                ? "self-end bg-primary text-primary-foreground"
                : "self-start bg-muted text-foreground"
            )}
          >
            {msg.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form className="flex gap-2 p-3 border-t bg-muted/50" onSubmit={handleSend}>
        <Input
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Type a message..."
          autoComplete="off"
        />
        <Button type="submit" disabled={sendMessage.isPending || !message.trim()}>
          Send
        </Button>
      </form>
    </div>
  );
}