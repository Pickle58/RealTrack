import { Skeleton } from "@/components/ui/skeleton";

export default function PropertiesLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-4 w-32" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Skeleton className="h-9 w-full sm:max-w-md" />
        <Skeleton className="h-9 w-[190px] sm:ml-auto" />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_unused, index) => (
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-6" key={index}>
            <Skeleton className="aspect-[4/3] w-full rounded-lg" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
