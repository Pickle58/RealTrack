"use client";

import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/properties/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatPrice } from "@/lib/format";
import type { PropertyListItem } from "@/types/property";

const headClass = "h-10 px-4 text-xs font-medium tracking-wide uppercase text-text-secondary";
const cellClass = "px-4 py-3 text-sm text-text-primary";

export function DashboardTable({ items }: { items: PropertyListItem[] }) {
  return (
    <Card className="gap-0 overflow-hidden p-0">
      <Table>
        <TableCaption className="sr-only">Your listings</TableCaption>
        <TableHeader>
          <TableRow className="border-b border-border hover:bg-transparent">
            <TableHead className={headClass}>Property</TableHead>
            <TableHead className={headClass}>Status</TableHead>
            <TableHead className={headClass}>Beds</TableHead>
            <TableHead className={headClass}>Baths</TableHead>
            <TableHead className={headClass}>Price</TableHead>
            <TableHead className={headClass}>Updated</TableHead>
            <TableHead className={`${headClass} text-right`}>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map(({ property }) => (
            <TableRow
              className="border-b border-border-light hover:bg-surface-secondary"
              key={property.id}
            >
              <TableCell className={`${cellClass} whitespace-normal`}>
                <Link className="flex flex-col gap-0.5" href={`/properties/${property.id}/edit`}>
                  <span className="font-medium text-text-primary">{property.addressLine1}</span>
                  <span className="text-xs text-text-muted">
                    {property.city}, {property.stateProvince} {property.postalCode}
                  </span>
                </Link>
              </TableCell>
              <TableCell className={cellClass}>
                <StatusBadge status={property.status} />
              </TableCell>
              <TableCell className={cellClass}>{property.bedrooms}</TableCell>
              <TableCell className={cellClass}>{property.bathrooms}</TableCell>
              <TableCell className={`${cellClass} font-medium`}>
                {formatPrice(property.priceCents, property.currency)}
              </TableCell>
              <TableCell className={`${cellClass} text-xs text-text-muted`}>
                {formatDate(property.updatedAt)}
              </TableCell>
              <TableCell className={`${cellClass} text-right`}>
                <div className="flex items-center justify-end gap-1">
                  <Button asChild size="sm" variant="ghost">
                    <Link href={`/properties/${property.id}/edit`}>
                      <Pencil aria-hidden />
                      Edit
                    </Link>
                  </Button>
                  <ConfirmDialog
                    confirmLabel="Delete property"
                    description={`This removes ${property.addressLine1}, ${property.city} and its photos. It can't be undone.`}
                    onConfirm={() =>
                      toast.success("Deleting is not connected yet.", {
                        description: `${property.addressLine1} was kept.`,
                      })
                    }
                    title={`Delete “${property.addressLine1}”?`}
                    trigger={
                      <Button
                        aria-label={`Delete ${property.addressLine1}`}
                        className="text-error hover:bg-error-light"
                        size="sm"
                        type="button"
                        variant="ghost"
                      >
                        <Trash2 aria-hidden />
                        Delete
                      </Button>
                    }
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
