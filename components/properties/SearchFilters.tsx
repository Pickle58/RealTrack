"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DEFAULT_PAGE_SIZE,
  defaultPropertySearch,
  propertySearchToParams,
  propertySortSchema,
  type PropertySearchInput,
} from "@/validations/property-search";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
] as const;

type FilterValues = {
  q: string;
  minPrice: string;
  maxPrice: string;
  minBedrooms: string;
  minBathrooms: string;
  sort: PropertySearchInput["sort"];
};

function toInputValue(value: number | undefined): string {
  return value === undefined ? "" : String(value);
}

function toFilterValues(search: PropertySearchInput): FilterValues {
  return {
    q: search.q,
    minPrice: toInputValue(search.minPrice),
    maxPrice: toInputValue(search.maxPrice),
    minBedrooms: toInputValue(search.minBedrooms),
    minBathrooms: toInputValue(search.minBathrooms),
    sort: search.sort,
  };
}

function toNumber(value: string): number | undefined {
  if (value.trim() === "") return undefined;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toSearchInput(values: FilterValues): PropertySearchInput {
  return {
    q: values.q.trim(),
    minPrice: toNumber(values.minPrice),
    maxPrice: toNumber(values.maxPrice),
    minBedrooms: toNumber(values.minBedrooms),
    minBathrooms: toNumber(values.minBathrooms),
    sort: propertySortSchema.parse(values.sort),
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  };
}

export function SearchFilters({ initial }: { initial: PropertySearchInput }) {
  const router = useRouter();
  const [values, setValues] = useState<FilterValues>(() => toFilterValues(initial));
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const activeCount = [
    values.minPrice,
    values.maxPrice,
    values.minBedrooms,
    values.minBathrooms,
  ].filter((value) => value.trim() !== "").length;

  function apply(next: FilterValues) {
    setValues(next);
    const query = propertySearchToParams(toSearchInput(next)).toString();
    setSheetOpen(false);
    startTransition(() => router.push(query ? `/properties?${query}` : "/properties"));
  }

  function handleSheetOpenChange(open: boolean) {
    setSheetOpen(open);
    if (!open) setValues(toFilterValues(initial));
  }

  const filterFields = (
    <div className="grid w-full gap-4 sm:grid-cols-2 md:grid-cols-4">
      <Label className="flex-col items-start gap-2 text-text-secondary">
        Min price
        <Input
          inputMode="numeric"
          min={0}
          onChange={(event) =>
            setValues((current) => ({ ...current, minPrice: event.target.value }))
          }
          placeholder="Any"
          type="number"
          value={values.minPrice}
        />
      </Label>
      <Label className="flex-col items-start gap-2 text-text-secondary">
        Max price
        <Input
          inputMode="numeric"
          min={0}
          onChange={(event) =>
            setValues((current) => ({ ...current, maxPrice: event.target.value }))
          }
          placeholder="Any"
          type="number"
          value={values.maxPrice}
        />
      </Label>
      <Label className="flex-col items-start gap-2 text-text-secondary">
        Min bedrooms
        <Input
          inputMode="numeric"
          min={0}
          onChange={(event) =>
            setValues((current) => ({ ...current, minBedrooms: event.target.value }))
          }
          placeholder="Any"
          type="number"
          value={values.minBedrooms}
        />
      </Label>
      <Label className="flex-col items-start gap-2 text-text-secondary">
        Min bathrooms
        <Input
          inputMode="decimal"
          min={0}
          onChange={(event) =>
            setValues((current) => ({ ...current, minBathrooms: event.target.value }))
          }
          placeholder="Any"
          step={0.5}
          type="number"
          value={values.minBathrooms}
        />
      </Label>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form
          className="flex w-full items-center gap-2 sm:max-w-md"
          onSubmit={(event) => {
            event.preventDefault();
            apply(values);
          }}
        >
          <div className="relative w-full">
            <Search
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-muted"
            />
            <Input
              aria-label="Search by address, city or postal code"
              className="pl-9"
              onChange={(event) => setValues((current) => ({ ...current, q: event.target.value }))}
              placeholder="Address, city or postal code"
              type="search"
              value={values.q}
            />
          </div>
          <Button disabled={isPending} type="submit" variant="secondary">
            Search
          </Button>
        </form>

        <div className="flex items-center gap-3 sm:ml-auto">
          <Select
            onValueChange={(value) => apply({ ...values, sort: propertySortSchema.parse(value) })}
            value={values.sort}
          >
            <SelectTrigger aria-label="Sort listings" className="w-[190px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Sheet onOpenChange={handleSheetOpenChange} open={sheetOpen}>
            <SheetTrigger asChild>
              <Button className="md:hidden" type="button" variant="secondary">
                <SlidersHorizontal aria-hidden />
                Filters
                {activeCount > 0 ? ` (${activeCount})` : ""}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
                <SheetDescription>
                  Narrow the listings by price, bedrooms and bathrooms.
                </SheetDescription>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto px-4">{filterFields}</div>
              <SheetFooter>
                <Button disabled={isPending} onClick={() => apply(values)} type="button">
                  Apply filters
                </Button>
                <Button onClick={() => apply(toFilterValues(defaultPropertySearch))} type="button" variant="ghost">
                  Clear filters
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <Card className="hidden gap-4 p-6 md:flex md:flex-row md:items-end">
        {filterFields}
        <div className="flex shrink-0 items-center gap-2">
          <Button disabled={isPending} onClick={() => apply(values)} type="button">
            Apply filters
          </Button>
          <Button
            onClick={() => apply(toFilterValues(defaultPropertySearch))}
            type="button"
            variant="ghost"
          >
            Clear filters
          </Button>
        </div>
      </Card>
    </div>
  );
}
