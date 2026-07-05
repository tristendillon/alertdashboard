"use client";

import Link from "next/link";

import { InfiniteDataTable } from "@/components/data-table/infinite-data-table";
import { RegexCell } from "@/components/ui/regex-cell";
import { ArrayCell } from "@/components/ui/array-cell";
import { TimestampCell } from "@/components/ui/timestamp-cell";
import { NumberCell } from "@/components/ui/number-cell";
import { ActionCell } from "@/components/ui/action-cell";
import { Cell, CellContent } from "@/components/ui/cell";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Plus } from "lucide-react";
import { useInfiniteTable } from "@/hooks/use-infinite-table";
import { useSearchList } from "@/hooks/use-search-list";
import { DrawerEntity } from "@/lib/enums";
import {
  STRATEGY_META,
  describeEffect,
  tintChipClasses,
  type StrategyTint,
} from "@/lib/transformations/fields";
import { cn } from "@/utils/ui";
import { TableActionBar } from "@/components/table-action-bar";
import { api } from "@sizeupdashboard/convex/src/api/_generated/api.js";
import type { Id } from "@sizeupdashboard/convex/src/api/_generated/dataModel.js";
import type {
  FieldTransformation,
  TransformationRule,
} from "@sizeupdashboard/convex/src/api/schema.js";
import type { ColumnDef } from "@tanstack/react-table";
import type { LucideIcon } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";

// Follow the literal base-path convention used elsewhere (breadcrumbs, sidebar).
const RULES_BASE = "/dashboard/transformation-rules";

type ConfigMap = Map<Id<"fieldTransformations">, FieldTransformation>;

interface EffectChip {
  key: string;
  tint: StrategyTint;
  Icon: LucideIcon;
  text: string;
}

/**
 * "What it does" cell: maps a rule's transformation ids through the shared
 * field-transformation config map and renders up to three plain-language chips
 * (icon + tint + describeEffect). The lat/lng random-offset pair collapses into
 * a single "offset the map pin…" chip; any remainder folds into a "+K more"
 * tooltip. Shows a subtle skeleton while the configs query is still loading.
 */
function EffectChipsCell({
  ids,
  configById,
  loading,
}: {
  ids: Id<"fieldTransformations">[];
  configById: ConfigMap;
  loading: boolean;
}) {
  const effects = useMemo<EffectChip[]>(() => {
    const seen = new Set<string>();
    const out: EffectChip[] = [];
    for (const id of ids) {
      const cfg = configById.get(id);
      if (!cfg) continue;
      // Collapse the lat+lng offset pair into one chip (dedupe by effect).
      if (cfg.field.startsWith("location.") && cfg.strategy === "random_offset") {
        if (seen.has("loc-offset")) continue;
        seen.add("loc-offset");
      }
      const meta = STRATEGY_META[cfg.strategy];
      out.push({
        key: id,
        tint: meta.tint,
        Icon: meta.icon,
        text: describeEffect(cfg),
      });
    }
    return out;
  }, [ids, configById]);

  if (ids.length === 0) {
    return (
      <Cell>
        <CellContent className="text-muted-foreground text-xs" truncate={false}>
          nothing yet
        </CellContent>
      </Cell>
    );
  }

  if (effects.length === 0) {
    return (
      <Cell>
        <CellContent truncate={false}>
          {loading ? (
            <span className="bg-muted inline-block h-4 w-28 animate-pulse rounded" />
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </CellContent>
      </Cell>
    );
  }

  const visible = effects.slice(0, 3);
  const hidden = effects.slice(3);

  return (
    <Cell>
      <div className="flex flex-wrap items-center gap-1">
        {visible.map(({ key, tint, Icon, text }) => (
          <span
            key={key}
            title={text}
            className={cn(
              "inline-flex max-w-[190px] items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
              tintChipClasses(tint),
            )}
          >
            <Icon className="size-3 shrink-0" />
            <span className="truncate">{text}</span>
          </span>
        ))}
        {hidden.length > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="cursor-default">
                +{hidden.length} more
              </Badge>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <ul className="flex flex-col gap-0.5">
                {hidden.map(({ key, text }) => (
                  <li key={key}>{text}</li>
                ))}
              </ul>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </Cell>
  );
}

export function TransformationRulesTable() {
  const { results, status, loadMore, search, setSearch } = useSearchList(
    api.transformations.listTransformationRules,
  );
  const setEnabled = useMutation(api.transformations.setTransformationRuleEnabled);

  // Single query for the whole table; build an id → config lookup once.
  const fieldTransformations = useQuery(
    api.transformations.getFieldTransformations,
    {},
  );
  const configsLoading = fieldTransformations === undefined;
  const configById = useMemo<ConfigMap>(() => {
    const map: ConfigMap = new Map();
    for (const ft of fieldTransformations ?? []) map.set(ft._id, ft);
    return map;
  }, [fieldTransformations]);

  const toggleEnabled = useCallback(
    async (id: Id<"transformationRules">, enabled: boolean) => {
      try {
        await setEnabled({ id, enabled });
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to update rule",
        );
      }
    },
    [setEnabled],
  );

  const columns = useMemo<ColumnDef<TransformationRule>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
            className="translate-y-0.5"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
            className="translate-y-0.5"
          />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 40,
      },
      {
        accessorKey: "name",
        header: "Name",
        minSize: 150,
        enableResizing: true,
        cell: ({ row }) => {
          return (
            <Cell>
              <CellContent className="font-medium">
                {row.original.name}
              </CellContent>
            </Cell>
          );
        },
        enableSorting: false,
      },
      {
        id: "whatItDoes",
        header: "What it does",
        minSize: 240,
        enableResizing: true,
        enableSorting: false,
        cell: ({ row }) => (
          <EffectChipsCell
            ids={row.original.transformations}
            configById={configById}
            loading={configsLoading}
          />
        ),
      },
      {
        accessorKey: "enabled",
        header: "Status",
        size: 130,
        enableResizing: true,
        cell: ({ row }) => {
          const enabled = row.original.enabled !== false;
          return (
            <Cell>
              <div className="flex items-center gap-2">
                <Switch
                  checked={enabled}
                  onCheckedChange={(next) =>
                    void toggleEnabled(row.original._id, next)
                  }
                  aria-label={enabled ? "Disable rule" : "Enable rule"}
                />
                <span className="text-muted-foreground text-xs">
                  {enabled ? "Enabled" : "Disabled"}
                </span>
              </div>
            </Cell>
          );
        },
        enableSorting: false,
      },
      {
        accessorKey: "dispatchTypeRegex",
        header: "Dispatch Regex",
        minSize: 200,
        enableResizing: true,
        cell: ({ row }) => {
          return (
            <RegexCell
              pattern={row.original.dispatchTypeRegex}
              showValidation={true}
            />
          );
        },
        enableSorting: false,
      },
      {
        accessorKey: "keywords",
        header: "Keywords",
        size: 180,
        enableResizing: true,
        cell: ({ row }) => {
          return (
            <ArrayCell
              items={row.original.keywords}
              maxVisible={2}
              badgeVariant="outline"
            />
          );
        },
        enableSorting: false,
      },
      {
        accessorKey: "dispatchTypes",
        header: "Dispatch Types",
        size: 120,
        enableResizing: true,
        cell: ({ row }) => {
          const count = row.original.dispatchTypes.length;
          return (
            <NumberCell
              value={count}
              suffix={count === 1 ? " type" : " types"}
              decimals={0}
            />
          );
        },
        enableSorting: false,
      },
      {
        id: "testDispatches",
        header: "Test dispatches",
        size: 130,
        enableResizing: true,
        enableSorting: false,
        cell: ({ row }) => {
          const count = row.original.testDispatchIds?.length ?? 0;
          if (count === 0) {
            return (
              <Cell>
                <CellContent className="text-muted-foreground" truncate={false}>
                  —
                </CellContent>
              </Cell>
            );
          }
          return <NumberCell value={count} decimals={0} />;
        },
      },
      {
        accessorKey: "_creationTime",
        header: "Created At",
        size: 140,
        enableResizing: true,
        enableSorting: false,
        cell: ({ row }) => {
          return (
            <TimestampCell
              timestamp={row.original._creationTime}
              format="short-12h"
            />
          );
        },
      },
      {
        id: "actions",
        header: "",
        size: 50,
        enableResizing: true,
        cell: ({ row }) => {
          return (
            <ActionCell
              entity={DrawerEntity.TRANSFORMATION_RULE}
              itemId={row.original._id}
              editHref={`${RULES_BASE}/${row.original._id}`}
            />
          );
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [toggleEnabled, configById, configsLoading],
  );

  const { table } = useInfiniteTable({
    data: results,
    columns,
    getRowId: (originalRow) => originalRow._id,
  });

  return (
    <InfiniteDataTable
      table={table}
      status={status}
      onLoadMore={loadMore}
      rowClassName={(rule) => (rule.enabled === false ? "opacity-55" : undefined)}
      actionBar={
        <TableActionBar table={table} entityName="transformation rules" />
      }
    >
      <div className="flex items-center justify-between gap-2">
        <Input
          placeholder="Search by name..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="max-w-sm"
        />
        <Button size="sm" asChild>
          <Link href={`${RULES_BASE}/new`}>
            <Plus className="mr-1 size-4" />
            New rule
          </Link>
        </Button>
      </div>
    </InfiniteDataTable>
  );
}
