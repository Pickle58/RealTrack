import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PropertyStatus } from "@/types/property";

const statusLabels: Record<PropertyStatus, string> = {
  active: "Active",
  draft: "Draft",
  sold: "Sold",
  off_market: "Off market",
};

const statusStyles: Record<PropertyStatus, string> = {
  active: "bg-success-light text-success-foreground",
  draft: "bg-info-light text-info-foreground",
  sold: "bg-neutral-light text-neutral-foreground",
  off_market: "bg-warning-light text-warning-foreground",
};

export function StatusBadge({ status, className }: { status: PropertyStatus; className?: string }) {
  return (
    <Badge className={cn(statusStyles[status], className)} variant="ghost">
      {statusLabels[status]}
    </Badge>
  );
}
