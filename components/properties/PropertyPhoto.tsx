"use client";

import { useEffect, useRef, useState } from "react";
import { PropertyImagePlaceholder } from "@/components/properties/PropertyImagePlaceholder";

/** A missing object or an R2 outage must render the neutral placeholder, never a broken image. */
export function PropertyPhoto({
  src,
  alt,
  className,
  placeholderClassName,
}: {
  src: string;
  alt: string;
  className?: string;
  placeholderClassName?: string;
}) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  // An image can fail before hydration, when onError is not attached yet.
  useEffect(() => {
    const image = ref.current;
    if (image?.complete && image.naturalWidth === 0) setFailed(true);
  }, [src]);

  if (failed) {
    return <PropertyImagePlaceholder className={placeholderClassName ?? className} />;
  }

  return <img alt={alt} className={className} onError={() => setFailed(true)} ref={ref} src={src} />;
}
