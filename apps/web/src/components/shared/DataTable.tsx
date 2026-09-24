import { ReactNode } from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T, index: number) => ReactNode;
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
  width?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (row: T) => string;
  isLoading?: boolean;
  emptyState?: ReactNode;
  selection?: {
    enabled: boolean;
    selectedIds: string[];
    onSelectionChange: (ids: string[]) => void;
  };
  sort?: {
    field: string;
    direction: "asc" | "desc";
    onSortChange: (field: string, direction: "asc" | "desc") => void;
  };
  onRowClick?: (row: T) => void;
  rowClassName?: (row: T) => string;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  isLoading,
  emptyState,
  selection,
  sort,
  onRowClick,
  rowClassName,
}: DataTableProps<T>) {
  const isSelectionEnabled = selection?.enabled === true;

  const allSelected =
    isSelectionEnabled &&
    data.length > 0 &&
    data.every((row) => selection!.selectedIds.includes(keyExtractor(row)));

  const someSelected =
    isSelectionEnabled &&
    data.some((row) => selection!.selectedIds.includes(keyExtractor(row)));

  const handleSelectAll = () => {
    if (!isSelectionEnabled || !selection) return;
    if (allSelected) {
      selection.onSelectionChange([]);
    } else {
      selection.onSelectionChange(data.map(keyExtractor));
    }
  };

  const handleSelectRow = (id: string) => {
    if (!isSelectionEnabled || !selection) return;
    if (selection.selectedIds.includes(id)) {
      selection.onSelectionChange(selection.selectedIds.filter((x) => x !== id));
    } else {
      selection.onSelectionChange([...selection.selectedIds, id]);
    }
  };

  const handleSort = (column: Column<T>) => {
    if (!column.sortable || !sort) return;
    if (sort.field === column.key) {
      sort.onSortChange(column.key, sort.direction === "asc" ? "desc" : "asc");
    } else {
      sort.onSortChange(column.key, "asc");
    }
  };

  const renderSortIcon = (column: Column<T>) => {
    if (!column.sortable || !sort) return null;
    if (sort.field !== column.key) {
      return <ChevronsUpDown className="h-3 w-3 opacity-50" />;
    }
    return sort.direction === "asc" ? (
      <ChevronUp className="h-3 w-3" />
    ) : (
      <ChevronDown className="h-3 w-3" />
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="border-b bg-muted/50">
          <tr className="text-left text-xs font-medium text-muted-foreground uppercase">
            {isSelectionEnabled && (
              <th className="w-10 px-3 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) {
                      el.indeterminate = someSelected && !allSelected;
                    }
                  }}
                  onChange={handleSelectAll}
                  className="h-4 w-4 rounded border-input cursor-pointer"
                />
              </th>
            )}
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  "px-4 py-3",
                  column.sortable && "cursor-pointer select-none hover:bg-muted/80",
                  column.headerClassName
                )}
                style={column.width ? { width: column.width } : undefined}
                onClick={() => handleSort(column)}
              >
                <div className="flex items-center gap-1">
                  {column.header}
                  {renderSortIcon(column)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => {
            const id = keyExtractor(row);
            const isSelected =
              isSelectionEnabled && selection
                ? selection.selectedIds.includes(id)
                : false;

            return (
              <tr
                key={id}
                className={cn(
                  "border-b transition-colors",
                  onRowClick && "cursor-pointer",
                  isSelected ? "bg-primary/5" : "hover:bg-muted/30",
                  rowClassName?.(row)
                )}
                onClick={() => onRowClick?.(row)}
              >
                {isSelectionEnabled && (
                  <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleSelectRow(id)}
                      className="h-4 w-4 rounded border-input cursor-pointer"
                    />
                  </td>
                )}
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn("px-4 py-3 text-sm", column.className)}
                  >
                    {column.cell(row, index)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
