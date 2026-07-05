"use client";

import { FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/contexts/LanguageContext";

interface PaginationProps {
  page: number;
  pages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

function clampPage(value: number, pages: number): number {
  if (pages <= 0) return 1;
  return Math.min(Math.max(1, value), pages);
}

export function Pagination({ page, pages, total, pageSize, onPageChange }: PaginationProps) {
  const { t } = useTranslation();
  const [pageInput, setPageInput] = useState(String(page));

  useEffect(() => {
    setPageInput(String(page));
  }, [page]);

  if (total === 0) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  function commitPageInput() {
    const parsed = Number.parseInt(pageInput, 10);
    if (Number.isNaN(parsed)) {
      setPageInput(String(page));
      return;
    }
    const next = clampPage(parsed, pages);
    setPageInput(String(next));
    if (next !== page) {
      onPageChange(next);
    }
  }

  function handlePageSubmit(event: FormEvent) {
    event.preventDefault();
    commitPageInput();
  }

  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
      <p className="text-sm text-slate-500">
        {t("common.paginationShowing", { from, to, total })}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={page <= 1}
          onClick={() => onPageChange(1)}
        >
          {t("common.paginationFirst")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          {t("common.paginationPrevious")}
        </Button>

        <form
          onSubmit={handlePageSubmit}
          className="flex items-center gap-1.5 text-sm text-slate-600"
        >
          <label className="sr-only" htmlFor="pagination-page-input">
            {t("common.paginationGoToPage")}
          </label>
          <input
            id="pagination-page-input"
            type="number"
            min={1}
            max={pages}
            value={pageInput}
            onChange={(event) => setPageInput(event.target.value)}
            onBlur={commitPageInput}
            className="input-field h-8 w-14 px-2 py-1 text-center text-sm tabular-nums"
            aria-label={t("common.paginationGoToPage")}
          />
          <span className="tabular-nums whitespace-nowrap">
            {t("common.paginationOf", { pages })}
          </span>
        </form>

        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
        >
          {t("common.paginationNext")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={page >= pages}
          onClick={() => onPageChange(pages)}
        >
          {t("common.paginationLast")}
        </Button>
      </div>
    </div>
  );
}
