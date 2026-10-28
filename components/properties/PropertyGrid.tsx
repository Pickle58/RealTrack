import { PropertyCard } from "@/components/properties/PropertyCard";
import type { PropertyListItem } from "@/types/property";

export function PropertyGrid({ properties }: { properties: PropertyListItem[] }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {properties.map((item) => (
        <PropertyCard item={item} key={item.property.id} />
      ))}
    </div>
  );
}
