"use client";

import { useState } from "react";
import { PropertyImagePlaceholder } from "@/components/properties/PropertyImagePlaceholder";
import { PropertyPhoto } from "@/components/properties/PropertyPhoto";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { PropertyImage } from "@/types/property";

export function PropertyGallery({
  images,
  address,
}: {
  images: PropertyImage[];
  address: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const active = images[activeIndex];

  if (!active) {
    return <PropertyImagePlaceholder className="aspect-[4/3] w-full rounded-xl border border-border" />;
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        aria-label={`View a larger photo of ${address}`}
        className="block w-full overflow-hidden rounded-xl border border-border bg-surface-secondary"
        onClick={() => setLightboxOpen(true)}
        type="button"
      >
        <PropertyPhoto
          alt={active.altText || `Photo of ${address}`}
          className="aspect-[4/3] w-full object-cover"
          placeholderClassName="aspect-[4/3] w-full"
          src={active.src}
        />
      </button>

      {images.length > 1 ? (
        <div className="flex gap-3 overflow-x-auto">
          {images.map((image, index) => (
            <button
              aria-current={index === activeIndex ? "true" : undefined}
              aria-label={`Show photo ${index + 1} of ${images.length}`}
              className={cn(
                "h-16 w-20 shrink-0 overflow-hidden rounded-md border",
                index === activeIndex ? "border-accent" : "border-border",
              )}
              key={image.id}
              onClick={() => setActiveIndex(index)}
              type="button"
            >
              <PropertyPhoto
                alt={image.altText || `Photo ${index + 1} of ${address}`}
                className="h-full w-full object-cover"
                placeholderClassName="h-full w-full"
                src={image.src}
              />
            </button>
          ))}
        </div>
      ) : null}

      <Dialog onOpenChange={setLightboxOpen} open={lightboxOpen}>
        <DialogContent aria-describedby={undefined} className="sm:max-w-4xl">
          <DialogTitle className="sr-only">Photo of {address}</DialogTitle>
          <PropertyPhoto
            alt={active.altText || `Photo of ${address}`}
            className="max-h-[70vh] w-full rounded-md object-contain"
            placeholderClassName="min-h-[40vh] w-full rounded-md"
            src={active.src}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
