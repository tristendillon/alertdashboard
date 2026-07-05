"use client";

import * as React from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/utils/ui";

export interface TemplateField {
  key: string;
  label?: string;
}

interface TemplateInputProps {
  value: string;
  onChange: (value: string) => void;
  fields: TemplateField[];
  placeholder?: string;
  id?: string;
  className?: string;
}

// Matches an unclosed `{` followed by a partial token at the end of the text
// before the caret, e.g. "…rewrite {n" → partial "n".
const TOKEN_RE = /\{([\w.]*)$/;

/**
 * Text input for merge_data templates with Postman-style `{field}`
 * autocomplete. When the caret sits just after an unclosed `{token`, an
 * anchored dropdown suggests matching fields; accepting inserts the remainder
 * of the field key plus a closing `}`. Behaves like a plain controlled input
 * otherwise (onChange fires on every keystroke).
 */
export function TemplateInput({
  value,
  onChange,
  fields,
  placeholder,
  id,
  className,
}: TemplateInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [caret, setCaret] = React.useState<number | null>(null);
  const [open, setOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(0);

  const match = React.useMemo(() => {
    if (!open || caret === null) return null;
    const before = value.slice(0, caret);
    const m = TOKEN_RE.exec(before);
    if (!m) return null;
    return { partial: m[1] };
  }, [open, caret, value]);

  const suggestions = React.useMemo(() => {
    if (!match) return [];
    const partial = match.partial.toLowerCase();
    return fields.filter((f) => f.key.toLowerCase().startsWith(partial));
  }, [match, fields]);

  const showDropdown = match !== null && suggestions.length > 0;
  // Clamp instead of resetting via an effect: keeps the active row valid when
  // the suggestion list shrinks as the user types.
  const activeRow = suggestions.length
    ? Math.min(activeIndex, suggestions.length - 1)
    : 0;

  const accept = (field: TemplateField) => {
    if (!match || caret === null) return;
    const partialLen = match.partial.length;
    const before = value.slice(0, caret);
    const after = value.slice(caret);
    const insertion = `${field.key.slice(partialLen)}}`;
    const next = before + insertion + after;
    const nextCaret = caret + insertion.length;
    onChange(next);
    setOpen(false);
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (el) {
        el.focus();
        el.setSelectionRange(nextCaret, nextCaret);
        setCaret(nextCaret);
      }
    });
  };

  const syncCaret = (el: HTMLInputElement) => setCaret(el.selectionStart);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown) return;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((activeRow + 1) % suggestions.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((activeRow - 1 + suggestions.length) % suggestions.length);
        break;
      case "Enter":
      case "Tab": {
        const choice = suggestions[activeRow];
        if (choice) {
          e.preventDefault();
          accept(choice);
        }
        break;
      }
      case "Escape":
        e.preventDefault();
        setOpen(false);
        break;
    }
  };

  return (
    <div className={cn("relative", className)}>
      <Input
        ref={inputRef}
        id={id}
        className="font-mono"
        placeholder={placeholder}
        value={value}
        autoComplete="off"
        onChange={(e) => {
          setOpen(true);
          onChange(e.target.value);
          setCaret(e.target.selectionStart);
        }}
        onClick={(e) => {
          setOpen(true);
          syncCaret(e.currentTarget);
        }}
        onKeyUp={(e) => syncCaret(e.currentTarget)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          // Delay so a suggestion mousedown/click can complete first.
          window.setTimeout(() => setOpen(false), 120);
        }}
      />
      {showDropdown && (
        <div
          role="listbox"
          className="bg-popover text-popover-foreground absolute top-full left-0 z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-md border p-1 shadow-md"
        >
          {suggestions.map((field, i) => {
            const partialLen = match?.partial.length ?? 0;
            return (
              <button
                key={field.key}
                type="button"
                role="option"
                aria-selected={i === activeRow}
                className={cn(
                  "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm",
                  i === activeRow ? "bg-accent text-accent-foreground" : "",
                )}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => accept(field)}
              >
                <span className="font-mono">
                  <span className="text-primary font-semibold">
                    {field.key.slice(0, partialLen)}
                  </span>
                  <span className="text-muted-foreground">
                    {field.key.slice(partialLen)}
                  </span>
                </span>
                {field.label && (
                  <span className="text-muted-foreground ml-auto text-xs">
                    {field.label}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
