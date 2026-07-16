"use client";

import { useTranslation } from "@/contexts/LanguageContext";
import type { CalendlySalesRep } from "@/features/calendly/types";
import type { MerchantBrief } from "@/types/api";

export type ClientMerchantFilter = "all" | number;

interface ClientListFiltersProps {
  search: string;
  merchantFilter: ClientMerchantFilter;
  merchants: MerchantBrief[];
  showMerchantFilter: boolean;
  salesRepId: number | null;
  salesReps: CalendlySalesRep[];
  showSalesRepFilter: boolean;
  onSearchChange: (value: string) => void;
  onMerchantFilterChange: (value: ClientMerchantFilter) => void;
  onSalesRepFilterChange: (value: number | null) => void;
}

export function ClientListFilters({
  search,
  merchantFilter,
  merchants,
  showMerchantFilter,
  salesRepId,
  salesReps,
  showSalesRepFilter,
  onSearchChange,
  onMerchantFilterChange,
  onSalesRepFilterChange,
}: ClientListFiltersProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="min-w-0 flex-1 sm:max-w-xs lg:max-w-sm">
        <label htmlFor="clients-search" className="input-label mb-1">
          {t("clients.searchByName")}
        </label>
        <input
          id="clients-search"
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={t("clients.searchByNamePlaceholder")}
          className="input-field py-2"
          autoComplete="off"
        />
      </div>

      {showMerchantFilter ? (
        <div className="w-full sm:w-auto sm:min-w-[12rem]">
          <label htmlFor="clients-merchant-filter" className="input-label mb-1">
            {t("clients.merchant")}
          </label>
          <select
            id="clients-merchant-filter"
            value={merchantFilter === "all" ? "all" : String(merchantFilter)}
            onChange={(event) => {
              const value = event.target.value;
              onMerchantFilterChange(value === "all" ? "all" : Number(value));
            }}
            className="input-field py-2"
          >
            <option value="all">{t("clients.allMerchants")}</option>
            {merchants.map((merchant) => (
              <option key={merchant.id} value={merchant.id}>
                {merchant.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {showSalesRepFilter ? (
        <div className="w-full sm:w-auto sm:min-w-[12rem]">
          <label htmlFor="clients-sales-rep-filter" className="input-label mb-1">
            {t("prospects.columns.salesRep")}
          </label>
          <select
            id="clients-sales-rep-filter"
            value={salesRepId ?? ""}
            onChange={(event) =>
              onSalesRepFilterChange(event.target.value ? Number(event.target.value) : null)
            }
            className="input-field py-2"
          >
            <option value="">{t("common.all")}</option>
            {salesReps.map((rep) => (
              <option key={rep.id} value={rep.id}>
                {rep.first_name} {rep.last_name}
              </option>
            ))}
          </select>
        </div>
      ) : null}
    </div>
  );
}
