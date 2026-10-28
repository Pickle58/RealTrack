import Link from "next/link";
import { Button } from "@/components/ui/button";

type PageItem = number | "ellipsis";

function pageItems(page: number, pageCount: number): PageItem[] {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_unused, index) => index + 1);
  }

  const items: PageItem[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(pageCount - 1, page + 1);

  if (start > 2) items.push("ellipsis");
  for (let current = start; current <= end; current += 1) items.push(current);
  if (end < pageCount - 1) items.push("ellipsis");
  items.push(pageCount);

  return items;
}

export function Pagination({
  page,
  pageCount,
  basePath,
  query,
}: {
  page: number;
  pageCount: number;
  basePath: string;
  query?: Record<string, string>;
}) {
  if (pageCount <= 1) return null;

  const hrefFor = (target: number): string => {
    const params = new URLSearchParams(query);
    if (target > 1) params.set("page", String(target));
    else params.delete("page");

    const search = params.toString();
    return search ? `${basePath}?${search}` : basePath;
  };

  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-center gap-2">
      {page > 1 ? (
        <Button asChild size="sm" variant="secondary">
          <Link href={hrefFor(page - 1)}>Previous</Link>
        </Button>
      ) : (
        <Button disabled size="sm" variant="secondary">
          Previous
        </Button>
      )}

      <div className="flex items-center gap-1">
        {pageItems(page, pageCount).map((item, index) =>
          item === "ellipsis" ? (
            <span aria-hidden className="px-1 text-sm text-text-muted" key={`ellipsis-${index}`}>
              …
            </span>
          ) : item === page ? (
            <span
              aria-current="page"
              className="inline-flex h-8 min-w-8 items-center justify-center rounded-md border border-border bg-surface-secondary px-3 text-sm font-medium text-text-primary"
              key={item}
            >
              {item}
            </span>
          ) : (
            <Button asChild key={item} size="sm" variant="ghost">
              <Link aria-label={`Page ${item}`} href={hrefFor(item)}>
                {item}
              </Link>
            </Button>
          ),
        )}
      </div>

      {page < pageCount ? (
        <Button asChild size="sm" variant="secondary">
          <Link href={hrefFor(page + 1)}>Next</Link>
        </Button>
      ) : (
        <Button disabled size="sm" variant="secondary">
          Next
        </Button>
      )}
    </nav>
  );
}
