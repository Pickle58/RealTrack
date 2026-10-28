import Link from "next/link";
import { Search } from "lucide-react";
import { PropertyGrid } from "@/components/properties/PropertyGrid";
import { SearchFilters } from "@/components/properties/SearchFilters";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { search as searchProperties } from "@/services/properties";
import { parsePropertySearch, propertySearchToParams } from "@/validations/property-search";

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const rawSearchParams = await searchParams;
  const search = parsePropertySearch(rawSearchParams);
  const result = await searchProperties(search, null);

  const pageQuery = Object.fromEntries(propertySearchToParams({ ...search, page: 1 }));
  const filterKey = new URLSearchParams(pageQuery).toString();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-text-primary">Active listings</h1>
        <p className="text-sm text-text-secondary">
          {result.total} active {result.total === 1 ? "listing" : "listings"}
        </p>
      </header>

      <SearchFilters initial={search} key={filterKey} />

      {result.items.length > 0 ? (
        <>
          <PropertyGrid properties={result.items} />
          <Pagination
            basePath="/properties"
            page={result.page}
            pageCount={result.pageCount}
            query={pageQuery}
          />
        </>
      ) : (
        <EmptyState
          action={
            <Button asChild variant="secondary">
              <Link href="/properties">Clear filters</Link>
            </Button>
          }
          description="Try another city, a wider price range, or fewer bedrooms."
          icon={<Search aria-hidden className="size-8" />}
          title="No properties match your filters."
        />
      )}
    </div>
  );
}
