"use client";

import { useActiveDispatch } from "@/providers/active-dispatch-provider";
import { DispatchList } from "@/components/dispatch-list";
import { DispatchDetail } from "@/components/dispatch-detail";

export function ViewSidebar() {
  const { dispatch, activateDispatch } = useActiveDispatch();
  return (
    <section className="bg-sidebar overflow-y-none relative flex h-full w-full flex-col">
      {dispatch ? (
        <div className="bg-sidebar absolute inset-0 z-40 space-y-4 p-4">
          <DispatchDetail dispatch={dispatch} />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <DispatchList onDispatchClick={activateDispatch} />
        </div>
      )}
    </section>
  );
}
