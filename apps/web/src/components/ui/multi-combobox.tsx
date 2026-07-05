"use client";

import * as React from "react";
import { Check, SearchIcon } from "lucide-react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { OverflowChips } from "@/components/ui/overflow-chips";
import { cn } from "@/utils/ui";

export interface MultiComboboxOption {
  value: string;
  label: string;
  hint?: string;
}

interface MultiComboboxProps {
  options: MultiComboboxOption[];
  selected: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  maxVisibleChips?: number;
  id?: string;
  className?: string;
}

/**
 * Generic searchable multi-select. The trigger is a bordered box showing the
 * current selection as chips (with overflow "+K more") plus a search
 * affordance; opening reveals a filterable list. Picking an option toggles it
 * WITHOUT closing the popover so several can be chosen in one pass; Escape or an
 * outside click closes.
 *
 * Typing/filtering happens in the popover's command input (matches label +
 * hint) — a deliberate choice over inline-in-box typing to keep focus
 * management robust.
 */
export function MultiCombobox({
  options,
  selected,
  onChange,
  placeholder = "Select…",
  maxVisibleChips = 3,
  id,
  className,
}: MultiComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const listId = React.useId();

  const selectedOptions = React.useMemo(
    () =>
      selected
        .map((v) => options.find((o) => o.value === v))
        .filter((o): o is MultiComboboxOption => o !== undefined),
    [selected, options],
  );

  const toggle = (value: string) => {
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value],
    );
  };

  const remove = (value: string) =>
    onChange(selected.filter((v) => v !== value));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          tabIndex={0}
          className={cn(
            "border-input focus-visible:border-ring focus-visible:ring-ring/50 flex min-h-9 w-full cursor-pointer flex-wrap items-center gap-1 rounded-md border bg-transparent px-2 py-1 text-sm shadow-xs outline-none focus-visible:ring-[3px]",
            className,
          )}
        >
          {selectedOptions.length > 0 ? (
            <OverflowChips
              items={selectedOptions.map((o) => ({
                key: o.value,
                label: o.label,
              }))}
              max={maxVisibleChips}
              onRemove={remove}
            />
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <SearchIcon className="text-muted-foreground ml-auto size-4 shrink-0" />
        </div>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        id={listId}
        className="w-(--radix-popover-trigger-width) p-0"
      >
        <Command>
          <CommandInput placeholder="Search…" />
          <CommandList>
            <CommandEmpty>No matches.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selected.includes(option.value);
                return (
                  <CommandItem
                    key={option.value}
                    value={`${option.label} ${option.hint ?? ""}`}
                    onSelect={() => toggle(option.value)}
                  >
                    <Check
                      className={cn(
                        "size-4",
                        isSelected ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span>{option.label}</span>
                    {option.hint && (
                      <span className="text-muted-foreground ml-auto font-mono text-xs">
                        {option.hint}
                      </span>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
