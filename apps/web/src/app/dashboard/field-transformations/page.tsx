"use client";

import { Plus } from "lucide-react";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/ui";
import { useDrawerState } from "@/hooks/nuqs/use-drawer-state";
import { DrawerEntity, DrawerMode } from "@/lib/enums";
import { FieldTransformationsTable } from "./_components/field-transformations-table";
import { FieldsOverview } from "./_components/fields-overview";

const VIEWS = ["anatomy", "table"] as const;
const viewParser = parseAsStringLiteral(VIEWS).withDefault("anatomy");

const SUBTABS: { value: (typeof VIEWS)[number]; label: string }[] = [
  { value: "anatomy", label: "Dispatch anatomy" },
  { value: "table", label: "Table" },
];

export default function FieldTransformationsPage() {
  const [view, setView] = useQueryState("view", viewParser);
  const [, setFieldParam] = useQueryState("field");
  const { open } = useDrawerState();

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold">Field library</h2>
        <div className="inline-flex gap-0.5 rounded-lg bg-muted p-0.5">
          {SUBTABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => void setView(tab.value)}
              className={cn(
                "rounded-md px-3 py-1.5 text-[12.5px] font-semibold transition-colors",
                view === tab.value
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {view === "anatomy" ? (
          <Button
            size="sm"
            className="ml-auto"
            onClick={() => {
              void setFieldParam(null);
              open(DrawerEntity.FIELD_TRANSFORMATION, DrawerMode.CREATE);
            }}
          >
            <Plus className="size-4" />
            New transformation
          </Button>
        ) : null}
      </div>

      {view === "table" ? <FieldTransformationsTable /> : <FieldsOverview />}
    </div>
  );
}
