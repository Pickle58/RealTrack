"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Bath, BedDouble } from "lucide-react";
import { PropertyImagePlaceholder } from "@/components/properties/PropertyImagePlaceholder";
import { StatusBadge } from "@/components/properties/StatusBadge";
import { Card } from "@/components/ui/card";
import { formatPrice } from "@/lib/format";
import type { PropertyListItem } from "@/types/property";

export function PropertyCard({ item }: { item: PropertyListItem }) {
  const { property, coverImage } = item;
  const [coverFailed, setCoverFailed] = useState(false);
  const coverRef = useRef<HTMLImageElement>(null);

  // An image can fail before hydration, when onError is not yet attached.
  useEffect(() => {
    const img = coverRef.current;
    if (img?.complete && img.naturalWidth === 0) setCoverFailed(true);
  }, []);

  return (
    <Card className="gap-0 overflow-hidden p-0 transition-shadow hover:shadow-md">
      <Link className="flex h-full flex-col" href={`/properties/${property.id}`}>
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          {coverImage && !coverFailed ? (
            <img
              ref={coverRef}
              alt={coverImage.altText}
              className="h-full w-full object-cover"
              onError={() => setCoverFailed(true)}
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
          <div className="mt-auto flex items-center gap-4 pt-2 text-sm text-text-secondary">
            <span className="inline-flex items-center gap-1.5">
              <BedDouble aria-hidden className="size-4" />
              {property.bedrooms} bd
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Bath aria-hidden className="size-4" />
              {property.bathrooms} ba
            </span>
          </div>
        </div>
      </Link>
    </Card>
  );
}
