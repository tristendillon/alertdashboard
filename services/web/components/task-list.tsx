'use client'

import { useQuery } from "@tanstack/react-query";
import { api } from "@workspace/convex/app/_generated/api"
import { convexQuery } from "@convex-dev/react-query";

export default function TaskList() {
  const { data, isPending, error } = useQuery(
    convexQuery(api.messages.list, {}),
  );

  return (
    <div>
      {isPending && <p>Loading...</p>}
      {error && <p>Error: {error.message}</p>}
      {data && <p>Messages: {data.map(message => message._id)}</p>}
    </div>
  )
}