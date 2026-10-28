import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { MediaUploader } from "@/components/properties/MediaUploader";
import { PropertyForm } from "@/components/properties/PropertyForm";
import { Button } from "@/components/ui/button";
import { getOwnedProperty, TEMPORARY_OWNER_ID } from "@/services/properties";
import { propertyToFormValues } from "@/validations/property";

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getOwnedProperty(id, TEMPORARY_OWNER_ID);

  if (!detail) notFound();

  const { property } = detail;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Button asChild className="self-start" size="sm" variant="ghost">
          <Link href="/dashboard">
            <ArrowLeft aria-hidden />
            Back to dashboard
          </Link>
        </Button>

        <header className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-text-primary">Edit property</h1>
          <p className="text-sm text-text-secondary">
            {property.addressLine1}, {property.city}, {property.stateProvince} {property.postalCode}
          </p>
        </header>
      </div>

      <PropertyForm initial={propertyToFormValues(property)} mode="edit" propertyId={property.id} />
      <MediaUploader />
    </div>
  );
}
