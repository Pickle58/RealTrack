import { Bath, BedDouble } from "lucide-react";

export function PropertyFacts({
  bedrooms,
  bathrooms,
}: {
  bedrooms: number;
  bathrooms: number;
}) {
  return (
    <dl className="grid grid-cols-2 gap-4">
      <div className="flex flex-col gap-1">
        <dt className="text-xs font-medium text-text-secondary">Bedrooms</dt>
        <dd className="inline-flex items-center gap-2 text-sm font-medium text-text-primary">
          <BedDouble aria-hidden className="size-4 text-text-muted" />
          {bedrooms}
        </dd>
      </div>
      <div className="flex flex-col gap-1">
        <dt className="text-xs font-medium text-text-secondary">Bathrooms</dt>
        <dd className="inline-flex items-center gap-2 text-sm font-medium text-text-primary">
          <Bath aria-hidden className="size-4 text-text-muted" />
          {bathrooms}
        </dd>
      </div>
    </dl>
  );
}
