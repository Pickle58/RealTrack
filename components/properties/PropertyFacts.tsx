import { Bath, BedDouble, Droplet, Waves } from "lucide-react";
import type { SepticSystem, WaterSource } from "@/types/property";

const septicLabels: Record<SepticSystem, string> = { city: "City sewer", tank: "Septic tank" };
const waterLabels: Record<WaterSource, string> = { city: "City water", well: "Well" };

export function PropertyFacts({
  bedrooms,
  bathrooms,
  septic,
  water,
}: {
  bedrooms: number;
  bathrooms: number;
  septic: SepticSystem | null;
  water: WaterSource | null;
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
      <div className="flex flex-col gap-1">
        <dt className="text-xs font-medium text-text-secondary">Septic</dt>
        <dd className="inline-flex items-center gap-2 text-sm font-medium text-text-primary">
          <Waves aria-hidden className="size-4 text-text-muted" />
          {septic ? septicLabels[septic] : "Not specified"}
        </dd>
      </div>
      <div className="flex flex-col gap-1">
        <dt className="text-xs font-medium text-text-secondary">Water</dt>
        <dd className="inline-flex items-center gap-2 text-sm font-medium text-text-primary">
          <Droplet aria-hidden className="size-4 text-text-muted" />
          {water ? waterLabels[water] : "Not specified"}
        </dd>
      </div>
    </dl>
  );
}
