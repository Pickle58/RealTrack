"use client";

import Link from "next/link";
import { Bath, BedDouble, Ruler } from "lucide-react";
import { PropertyImagePlaceholder } from "@/components/properties/PropertyImagePlaceholder";
import { PropertyPhoto } from "@/components/properties/PropertyPhoto";
import { StatusBadge } from "@/components/properties/StatusBadge";
import { Card } from "@/components/ui/card";
import { formatLotSize, formatPrice } from "@/lib/format";
import type { PropertyListItem } from "@/types/property";

export function PropertyCard({ item }: { item: PropertyListItem }) {
  const { property, coverImage } = item;

  return (
    <Card className="gap-0 overflow-hidden p-0 transition-shadow hover:shadow-md">
      <Link className="flex h-full flex-col" href={`/properties/${property.id}`}>
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          {coverImage ? (
            <PropertyPhoto
              alt={coverImage.altText || `Photo of ${property.addressLine1}`}
              className="h-full w-full object-cover"
              placeholderClassName="h-full w-full"
              src={coverImage.src}
            />
          ) : (
            <PropertyImagePlaceholder className="h-full w-full" />
          )}
          <StatusBadge className="absolute top-3 left-3" status={property.status} />
        </div>

        <div className="flex flex-1 flex-col gap-2 p-6">
          <p className="text-xl font-bold text-accent">
            {formatPrice(property.priceCents, property.currency)}
          </p>
          <p className="text-sm font-medium text-text-primary">{property.addressLine1}</p>
          <p className="text-xs text-text-muted">
            {property.city}, {property.stateProvince} {property.postalCode}
          </p>
          <div className="mt-auto flex flex-wrap items-center gap-4 pt-2 text-sm text-text-secondary">
            {property.bedrooms !== null ? (
              <span className="inline-flex items-center gap-1.5">
                <BedDouble aria-hidden className="size-4" />
                {property.bedrooms} bd
              </span>
            ) : null}
            {property.bathrooms !== null ? (
              <span className="inline-flex items-center gap-1.5">
                <Bath aria-hidden className="size-4" />
                {property.bathrooms} ba
              </span>
            ) : null}
            {property.lotSize !== null && property.lotSizeUnit !== null ? (
              <span className="inline-flex items-center gap-1.5">
                <Ruler aria-hidden className="size-4" />
                {formatLotSize(property.lotSize, property.lotSizeUnit)}
              </span>
            ) : null}
          </div>
        </div>
      </Link>
    </Card>
  );
}
