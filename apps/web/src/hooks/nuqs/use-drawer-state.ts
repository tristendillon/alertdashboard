"use client";

import { useQueryState, type UseQueryStateOptions } from "nuqs";
import { useCallback } from "react";

import { DrawerEntity, DrawerMode } from "@/lib/enums";
import { drawerEntitySchema, drawerModeSchema } from "@/lib/schemas";

const entityOpts: UseQueryStateOptions<DrawerEntity> = {
  clearOnDefault: true,
  parse: (value) => drawerEntitySchema.parse(value),
  serialize: (value) => value,
};

const modeOpts: UseQueryStateOptions<DrawerMode> = {
  clearOnDefault: true,
  parse: (value) => drawerModeSchema.parse(value),
  serialize: (value) => value,
};

/**
 * URL-backed drawer routing: `?drawer=<entity>&mode=<create|edit|import|delete>&id=<id>`.
 * Deep-linkable and closes on browser Back. Replaces the old modal router.
 */
export function useDrawerState() {
  const [drawer, setDrawer] = useQueryState("drawer", entityOpts);
  const [mode, setMode] = useQueryState("mode", modeOpts);
  const [id, setId] = useQueryState("id", { clearOnDefault: true });

  const open = useCallback(
    (entity: DrawerEntity, nextMode: DrawerMode, itemId?: string) => {
      void setDrawer(entity);
      void setMode(nextMode);
      void setId(itemId ?? null);
    },
    [setDrawer, setMode, setId],
  );

  const close = useCallback(() => {
    void setDrawer(null);
    void setMode(null);
    void setId(null);
  }, [setDrawer, setMode, setId]);

  return { drawer, mode, id, open, close };
}
