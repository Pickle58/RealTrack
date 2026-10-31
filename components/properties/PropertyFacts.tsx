import { Bath, BedDouble, Droplet, Ruler, Waves, Zap } from "lucide-react";
import { formatLotSize } from "@/lib/format";
import type {
  ElectricSupply,
  LotSizeUnit,
  SepticSystem,
  WaterSource,
} from "@/types/property";

const septicLabels: Record<SepticSystem, string> = { city: "City sewer", tank: "Septic tank" };
const waterLabels: Record<WaterSource, string> = { city: "City water", well: "Well" };
const electricLabels: Record<ElectricSupply, string> = {
  at_property: "At property",
  available: "Available",
  none: "None",
};

export function PropertyFacts({
  bedrooms,
  bathrooms,
  lotSize,
  lotSizeUnit,
  electric,
  septic,
  water,
}: {
  bedrooms: number | null;
  bathrooms: number | null;
  lotSize: number | null;
  lotSizeUnit: LotSizeUnit | null;
  electric: ElectricSupply | null;
  septic: SepticSystem | null;
  water: WaterSource | null;
}) {
  // A KV entry written before lot size existed has neither field, so an unknown shape reads as unset.
  const lotSizeLabel =
    typeof lotSize === "number" && (lotSizeUnit === "sqft" || lotSizeUnit === "acres")
      ? formatLotSize(lotSize, lotSizeUnit)
      : "Not specified";

  return (
    <dl className="grid grid-cols-2 gap-4">
      <div className="flex flex-col gap-1">
        <dt className="text-xs font-medium text-text-secondary">Bedrooms</dt>
        <dd className="inline-flex items-center gap-2 text-sm font-medium text-text-primary">
          <BedDouble aria-hidden className="size-4 text-text-muted" />
          {bedrooms === null ? "Not specified" : bedrooms}
        </dd>
      </div>
      <div className="flex flex-col gap-1">
        <dt className="text-xs font-medium text-text-secondary">Bathrooms</dt>
        <dd className="inline-flex items-center gap-2 text-sm font-medium text-text-primary">
          <Bath aria-hidden className="size-4 text-text-muted" />
          {bathrooms === null ? "Not specified" : bathrooms}
        </dd>
      </div>
      <div className="flex flex-col gap-1">
        <dt className="text-xs font-medium text-text-secondary">Lot size</dt>
        <dd className="inline-flex items-center gap-2 text-sm font-medium text-text-primary">
          <Ruler aria-hidden className="size-4 text-text-muted" />
          {lotSizeLabel}
        </dd>
      </div>
      <div className="flex flex-col gap-1">
        <dt className="text-xs font-medium text-text-secondary">Electric</dt>
        <dd className="inline-flex items-center gap-2 text-sm font-medium text-text-primary">
          <Zap aria-hidden className="size-4 text-text-muted" />
          {electric ? electricLabels[electric] : "Not specified"}
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
