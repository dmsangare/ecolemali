import * as React from "react";
import { cn } from "@/lib/utils";
import { EmptyState } from "./empty-state";

export interface DataTableColumn<T> {
  key: string;
  header: React.ReactNode;
  cell: (row: T, index: number) => React.ReactNode;
  className?: string;
  align?: "left" | "center" | "right";
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: React.ReactNode;
  emptyAction?: React.ReactNode;
  className?: string;
  rowClassName?: (row: T, index: number) => string | undefined;
}

const alignClasses = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
} as const;

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  emptyTitle = "Aucune donnée",
  emptyDescription,
  emptyIcon,
  emptyAction,
  className,
  rowClassName,
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        icon={emptyIcon}
        action={emptyAction}
        className={className}
      />
    );
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-sis-lg border border-sis-neutral-200 bg-card dark:border-sis-neutral-800",
        className
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-sis-neutral-200 bg-sis-neutral-50 dark:border-sis-neutral-800 dark:bg-sis-neutral-900/60">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 py-3 font-semibold text-foreground",
                    alignClasses[col.align ?? "left"],
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-sis-neutral-200 dark:divide-sis-neutral-800">
            {data.map((row, index) => (
              <tr
                key={keyExtractor(row, index)}
                className={cn(
                  "transition-colors hover:bg-sis-neutral-50/70 dark:hover:bg-sis-neutral-900/40",
                  rowClassName?.(row, index)
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      "px-4 py-3 text-foreground",
                      alignClasses[col.align ?? "left"],
                      col.className
                    )}
                  >
                    {col.cell(row, index)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}