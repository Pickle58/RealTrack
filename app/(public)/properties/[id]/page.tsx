import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Info } from "lucide-react";
import { PropertyFacts } from "@/components/properties/PropertyFacts";
import { PropertyGallery } from "@/components/properties/PropertyGallery";
import { StatusBadge } from "@/components/properties/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatPrice } from "@/lib/format";
import { getActivePropertyById } from "@/services/properties";

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getActivePropertyById(id);

  if (!detail) notFound();

  const { property, images } = detail;
  const hasCoordinates = property.latitude !== null && property.longitude !== null;
  const coordinates = hasCoordinates
    ? `${property.latitude?.toFixed(5)}, ${property.longitude?.toFixed(5)}`
    : null;
  const mapHref = hasCoordinates
    ? `https://www.google.com/maps?q=${property.latitude},${property.longitude}`
    : null;

  return (
    <article className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Button asChild className="self-start" size="sm" variant="ghost">
          <Link href="/properties">
            <ArrowLeft aria-hidden />
            Browse all properties
          </Link>
        </Button>

        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold text-text-primary">{property.addressLine1}</h1>
          <StatusBadge status={property.status} />
        </div>

        <p className="text-sm text-text-muted">
          {property.addressLine2 ? `${property.addressLine2}, ` : ""}
          {property.city}, {property.stateProvince} {property.postalCode} · {property.country}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PropertyGallery address={property.addressLine1} images={images} />
        </div>

        <Card className="gap-6 p-6">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-medium text-text-secondary">Price</p>
            <p className="text-3xl font-bold text-accent">
              {formatPrice(property.priceCents, property.currency)}
            </p>
          </div>

          <PropertyFacts bathrooms={property.bathrooms} bedrooms={property.bedrooms} />

          <div className="flex flex-col gap-1">
            <p className="text-xs font-medium text-text-secondary">Location</p>
            {coordinates && mapHref ? (
              <p className="flex flex-wrap items-center gap-2 text-sm text-text-primary">
                {coordinates}
                <a
                  className="inline-flex items-center gap-1 font-medium text-accent hover:underline"
                  href={mapHref}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Open in map
                  <ExternalLink aria-hidden className="size-3.5" />
                </a>
              </p>
            ) : (
              <p className="inline-flex items-center gap-2 text-xs text-text-muted">
                <Info aria-hidden className="size-3.5" />
                Location not verified
              </p>
            )}
          </div>
        </Card>
      </div>
    </article>
  );
}
