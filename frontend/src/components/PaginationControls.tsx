import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type PaginationControlsProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  prevLabel?: string;
  nextLabel?: string;
  className?: string;
};

const buildPageList = (page: number, totalPages: number) => {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: Array<number | "ellipsis"> = [1];

  if (page > 3) {
    pages.push("ellipsis");
  }

  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);

  for (let current = start; current <= end; current++) {
    pages.push(current);
  }

  if (page < totalPages - 2) {
    pages.push("ellipsis");
  }

  pages.push(totalPages);

  return pages;
};

export function PaginationControls({
  page,
  totalPages,
  onPageChange,
  prevLabel = "Previous",
  nextLabel = "Next",
  className,
}: PaginationControlsProps) {
  if (totalPages < 1) return null;

  const handleChange = (nextPage: number) => {
    const clamped = Math.min(Math.max(1, nextPage), totalPages);
    if (clamped !== page) {
      onPageChange(clamped);
    }
  };

  return (
    <Pagination className={className}>
      <PaginationContent>
        <PaginationItem>
          <PaginationLink
            href="#"
            aria-label={prevLabel}
            aria-disabled={page <= 1}
            size="default"
            className={cn(
              "gap-2 px-3 sm:px-4 whitespace-nowrap",
              page <= 1 && "pointer-events-none opacity-50"
            )}
            onClick={(event) => {
              event.preventDefault();
              handleChange(page - 1);
            }}
          >
            <ChevronLeftIcon />
            <span className="hidden sm:block">{prevLabel}</span>
          </PaginationLink>
        </PaginationItem>

        {buildPageList(page, totalPages).map((item, index) =>
          item === "ellipsis" ? (
            <PaginationItem key={`ellipsis-${index}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={item}>
              <PaginationLink
                href="#"
                isActive={item === page}
                onClick={(event) => {
                  event.preventDefault();
                  handleChange(item);
                }}
              >
                {item}
              </PaginationLink>
            </PaginationItem>
          )
        )}

        <PaginationItem>
          <PaginationLink
            href="#"
            aria-label={nextLabel}
            aria-disabled={page >= totalPages}
            size="default"
            className={cn(
              "gap-2 px-3 sm:px-4 whitespace-nowrap",
              page >= totalPages && "pointer-events-none opacity-50"
            )}
            onClick={(event) => {
              event.preventDefault();
              handleChange(page + 1);
            }}
          >
            <span className="hidden sm:block">{nextLabel}</span>
            <ChevronRightIcon />
          </PaginationLink>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
