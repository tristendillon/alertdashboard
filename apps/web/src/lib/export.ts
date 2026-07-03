import type { Table } from "@tanstack/react-table";

interface ExportOptions {
  excludeColumns?: string[];
  onlySelected?: boolean;
  filename?: string;
}

export function exportTableToCSV<TData>(
  table: Table<TData>,
  options: ExportOptions = {},
) {
  const {
    excludeColumns = [],
    onlySelected = false,
    filename = "export.csv",
  } = options;

  // Get rows to export
  const rows = onlySelected
    ? table.getFilteredSelectedRowModel().rows
    : table.getRowModel().rows;

  if (rows.length === 0) {
    return;
  }

  // Get visible columns, excluding specified ones
  const columns = table
    .getVisibleLeafColumns()
    .filter((column) => !excludeColumns.includes(column.id));

  // Generate header row
  const headers = columns
    .map((column) => {
      const header = column.columnDef.header;
      if (typeof header === "string") {
        return header;
      }
      if (typeof header === "function") {
        // For function headers, try to extract title from meta or use id
        const meta = column.columnDef.meta;
        return meta?.label || column.id;
      }
      return column.id;
    })
    .map(escapeCSVField);

  // Generate data rows
  const dataRows = rows.map((row) =>
    columns
      .map((column) => {
        const value = row.getValue(column.id);
        return escapeCSVField(String(value ?? ""));
      })
      .join(","),
  );

  // Combine header and data
  const csvContent = [headers.join(","), ...dataRows].join("\n");

  // Create and download file
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

function escapeCSVField(field: string): string {
  // If field contains comma, newline, or quote, wrap in quotes and escape internal quotes
  if (field.includes(",") || field.includes("\n") || field.includes('"')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}
