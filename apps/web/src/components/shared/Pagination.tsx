import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui";

interface PaginationProps {
  page: number;
  pages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  showLimitSelector?: boolean;
}

export function Pagination({
  page,
  pages,
  total,
  limit,
  onPageChange,
  onLimitChange,
  showLimitSelector = true,
}: PaginationProps) {
  if (total === 0) return null;

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  const getPageNumbers = () => {
    const nums: (number | string)[] = [];
    const maxVisible = 5;

    if (pages <= maxVisible) {
      for (let i = 1; i <= pages; i++) nums.push(i);
    } else {
      nums.push(1);
      if (page > 3) nums.push("...");

      const startPage = Math.max(2, page - 1);
      const endPage = Math.min(pages - 1, page + 1);

      for (let i = startPage; i <= endPage; i++) {
        if (!nums.includes(i)) nums.push(i);
      }

      if (page < pages - 2) nums.push("...");
      if (!nums.includes(pages)) nums.push(pages);
    }

    return nums;
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-t px-4 py-3">
      <div className="flex items-center gap-4">
        <p className="text-sm text-muted-foreground">
          <strong>{start}</strong> - <strong>{end}</strong> sur <strong>{total}</strong>
        </p>
        {showLimitSelector && onLimitChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Par page :</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="h-8 rounded-md border border-input bg-transparent px-2 text-sm"
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          disabled={page === 1}
          onClick={() => onPageChange(1)}
          title="Premiere page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          title="Page precedente"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {getPageNumbers().map((num, idx) =>
          typeof num === "number" ? (
            <Button
              key={idx}
              variant={page === num ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(num)}
              className="min-w-[36px]"
            >
              {num}
            </Button>
          ) : (
            <span key={idx} className="px-2 text-muted-foreground">
              {num}
            </span>
          )
        )}

        <Button
          variant="outline"
          size="icon"
          disabled={page === pages}
          onClick={() => onPageChange(page + 1)}
          title="Page suivante"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          disabled={page === pages}
          onClick={() => onPageChange(pages)}
          title="Derniere page"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
