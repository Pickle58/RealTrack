import { PropertyForm } from "@/components/properties/PropertyForm";
import { emptyPropertyFormValues } from "@/validations/property";

export default function NewPropertyPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-text-primary">Add property</h1>
        <p className="text-sm text-text-secondary">
          Catalog the address, facts and status of a listing. Photos come next.
        </p>
      </header>

      <PropertyForm initial={emptyPropertyFormValues} mode="create" />
    </div>
  );
}
