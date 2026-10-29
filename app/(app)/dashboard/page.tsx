import Link from "next/link";
import { Building2, Plus } from "lucide-react";
import { DashboardTable } from "@/components/dashboard/DashboardTable";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { requirePageUser } from "@/lib/auth/current-user";
import { canWriteListings, ownerScope } from "@/lib/auth/guards";
import { listByOwner } from "@/services/properties";

export default async function DashboardPage() {
  const user = await requirePageUser();
  const canCreate = canWriteListings(user.role);

  const items = await listByOwner(ownerScope(user));

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-text-primary">My listings</h1>
          <p className="text-sm text-text-secondary">
            {items.length} {items.length === 1 ? "property" : "properties"} across every status.
          </p>
        </div>
        {canCreate ? (
          <Button asChild>
            <Link href="/properties/new">
              <Plus aria-hidden />
              Add property
            </Link>
          </Button>
        ) : null}
      </header>

      {items.length > 0 ? (
        <DashboardTable items={items} />
      ) : (
        <EmptyState
          action={
            canCreate ? (
              <Button asChild>
                <Link href="/properties/new">Add property</Link>
              </Button>
            ) : undefined
          }
          description="Catalog a listing to see it here."
          icon={<Building2 aria-hidden className="size-8" />}
          title="You haven't added any properties yet."
        />
      )}
    </div>
  );
}
