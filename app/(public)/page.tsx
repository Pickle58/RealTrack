import Link from "next/link";
import { PropertyGrid } from "@/components/properties/PropertyGrid";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FEATURED_PROPERTY_LIMIT, getFeaturedProperties } from "@/services/properties";

export default async function LandingPage() {
  const featured = await getFeaturedProperties(FEATURED_PROPERTY_LIMIT);

  return (
    <div className="flex flex-col gap-6">
      <Card className="items-center gap-3 px-6 py-12 text-center md:px-10">
        <h1 className="text-3xl font-bold text-text-primary">Find your next home</h1>
        <p className="max-w-2xl text-sm leading-6 text-text-secondary">
          Browse the active listings published by the agents who manage them, or sign in to catalog
          the properties you represent.
        </p>
        <form
          action="/properties"
          className="mt-3 flex w-full max-w-xl items-center gap-2"
          method="get"
        >
          <Input
            aria-label="Search by address or city"
            name="q"
            placeholder="Search by address or city"
            type="search"
          />
          <Button type="submit">Search</Button>
        </form>
      </Card>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-text-primary">Featured listings</h2>
          <Button asChild size="sm" variant="ghost">
            <Link href="/properties">Browse all properties</Link>
          </Button>
        </div>
        <PropertyGrid properties={featured} />
      </section>
    </div>
  );
}
