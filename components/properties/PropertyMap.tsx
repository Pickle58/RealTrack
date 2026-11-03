"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { LayerGroup, Map as LeafletMap } from "leaflet";
import { Card } from "@/components/ui/card";
import type { PropertyPin } from "@/types/property";
import {
  MAX_LATITUDE,
  MAX_LONGITUDE,
  propertySearchToParams,
  toBounds,
  type MapBounds,
  type PropertySearchInput,
} from "@/validations/property-search";
import "leaflet/dist/leaflet.css";

const PAN_DEBOUNCE_MS = 400;
const DEFAULT_CENTER: [number, number] = [39.8283, -98.5795];
const DEFAULT_ZOOM = 4;
const MARKER_ICON_SIZE = 18;
const MARKER_CLASS = "block size-[18px] rounded-full border-2 border-surface bg-accent shadow-sm";

const TILE_URL =
  process.env.NEXT_PUBLIC_MAP_TILE_URL ?? "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION =
  process.env.NEXT_PUBLIC_MAP_TILE_ATTRIBUTION ?? "© OpenStreetMap contributors";

type Props = {
  search: PropertySearchInput;
  pins: PropertyPin[];
  withoutLocation: number;
  pinsTruncated: boolean;
};

/**
 * Three decimals keep the URL short. Rounding outward never collapses the box — `ceil(n)` stays
 * above `floor(s)` for any viewport with height — and a box a thousandth wider than the screen still
 * contains every pin that is visible.
 */
function roundBounds(bounds: {
  getNorth(): number;
  getSouth(): number;
  getEast(): number;
  getWest(): number;
}): MapBounds {
  return {
    n: Math.ceil(bounds.getNorth() * 1000) / 1000,
    s: Math.floor(bounds.getSouth() * 1000) / 1000,
    e: Math.ceil(bounds.getEast() * 1000) / 1000,
    w: Math.floor(bounds.getWest() * 1000) / 1000,
  };
}

/**
 * Leaflet reports corners of a zoomed-out map beyond the projection limits (and wraps longitude
 * past ±180), and a box that crosses the antimeridian cannot be written as `w < e`. Such a view is
 * "the whole world", which the page already expresses by having no bounds at all.
 */
function isExpressible(bounds: MapBounds): boolean {
  return (
    Number.isFinite(bounds.n) &&
    Number.isFinite(bounds.s) &&
    Number.isFinite(bounds.e) &&
    Number.isFinite(bounds.w) &&
    bounds.n <= MAX_LATITUDE &&
    bounds.s >= -MAX_LATITUDE &&
    bounds.e <= MAX_LONGITUDE &&
    bounds.w >= -MAX_LONGITUDE &&
    bounds.n > bounds.s &&
    bounds.e > bounds.w
  );
}

/** Both sides are already rounded to a thousandth, so an exact match means "the same viewport". */
function sameViewport(a: MapBounds | null, b: MapBounds): boolean {
  if (!a) return false;
  return a.n === b.n && a.s === b.s && a.e === b.e && a.w === b.w;
}

function corners(bounds: MapBounds): [[number, number], [number, number]] {
  return [
    [bounds.s, bounds.w],
    [bounds.n, bounds.e],
  ];
}

export function PropertyMap({ search, pins, withoutLocation, pinsTruncated }: Props) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layerRef = useRef<LayerGroup | null>(null);
  const searchRef = useRef(search);
  const pinsRef = useRef(pins);
  /**
   * The mount effect must run once. `useRouter()` is not guaranteed to keep its identity between
   * renders, and a re-run removes the map and builds a new one, which resets the view mid-gesture
   * (and looks like the map vanishing). The latest values are read through refs instead.
   */
  const routerRef = useRef(router);
  const transitionRef = useRef<ReturnType<typeof useTransition>[1] | null>(null);
  /** Debounced pan writes live in a ref so a navigation can cancel one that is still pending. */
  const panTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  /**
   * The viewport a `fitBounds` call produced. A fit emits `moveend` exactly like a gesture, and
   * Leaflet snaps the fitted box outward to whole pixels, so writing that event back would replace
   * the bounds the URL asked for with a wider box.
   */
  const fittedViewportRef = useRef<MapBounds | null>(null);
  const [ready, setReady] = useState(false);
  const [isPending, startTransition] = useTransition();

  const writeUrl = startTransition;

  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  useEffect(() => {
    transitionRef.current = writeUrl;
  }, [writeUrl]);

  useEffect(() => {
    searchRef.current = search;
  }, [search]);

  useEffect(() => {
    pinsRef.current = pins;
  }, [pins]);

  /**
   * A new URL means a navigation owns the view now (filters, sort, page). A pan still inside its
   * debounce would otherwise land afterwards and rewrite that navigation with the older viewport.
   */
  const searchKey = propertySearchToParams(search).toString();

  useEffect(() => {
    if (panTimerRef.current) clearTimeout(panTimerRef.current);
    panTimerRef.current = undefined;
  }, [searchKey]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const leaflet = await import("leaflet");
      if (cancelled || !containerRef.current) return;

      const L = leaflet.default;
      const map = L.map(containerRef.current, { zoomControl: true, scrollWheelZoom: false });
      const layer = L.layerGroup().addTo(map);

      L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: 19 }).addTo(map);
      mapRef.current = map;
      layerRef.current = layer;

      const start = toBounds(searchRef.current);
      if (start) {
        map.fitBounds(corners(start), { animate: false });
      } else if (pinsRef.current.length > 0) {
        map.fitBounds(
          pinsRef.current.map((pin) => [pin.latitude, pin.longitude] as [number, number]),
          { animate: false, padding: [24, 24] },
        );
      } else {
        map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
      }

      map.on("moveend", () => {
        if (panTimerRef.current) clearTimeout(panTimerRef.current);
        panTimerRef.current = setTimeout(() => {
          panTimerRef.current = undefined;
          const rounded = roundBounds(map.getBounds());

          // This event came from the fit above, not from a gesture: keep the requested bounds.
          if (fittedViewportRef.current && sameViewport(fittedViewportRef.current, rounded)) {
            fittedViewportRef.current = null;
            return;
          }

          const writable = isExpressible(rounded);

          if (!writable && toBounds(searchRef.current) === null) return;
          if (writable && sameViewport(toBounds(searchRef.current), rounded)) return;

          const next = propertySearchToParams(
            writable
              ? { ...searchRef.current, ...rounded, page: 1 }
              : {
                  ...searchRef.current,
                  n: undefined,
                  s: undefined,
                  e: undefined,
                  w: undefined,
                  page: 1,
                },
          );
          const query = next.toString();

          transitionRef.current?.(() => {
            routerRef.current.replace(query ? `/properties?${query}` : "/properties", {
              scroll: false,
            });
          });
        }, PAN_DEBOUNCE_MS);
      });

      setReady(true);
    })();

    return () => {
      cancelled = true;
      if (panTimerRef.current) clearTimeout(panTimerRef.current);
      panTimerRef.current = undefined;
      mapRef.current?.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const layer = layerRef.current;
    if (!ready || !layer) return;

    let cancelled = false;

    void (async () => {
      const leaflet = await import("leaflet");
      if (cancelled) return;

      const L = leaflet.default;
      layer.clearLayers();

      for (const pin of pins) {
        const element = document.createElement("span");
        element.className = MARKER_CLASS;

        const marker = L.marker([pin.latitude, pin.longitude], {
          alt: pin.addressLine1,
          title: pin.addressLine1,
          icon: L.divIcon({
            className: "",
            html: element,
            iconSize: [MARKER_ICON_SIZE, MARKER_ICON_SIZE],
          }),
        });

        marker.on("click", () => {
          router.push(`/properties/${pin.id}`);
        });
        marker.addTo(layer);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pins, ready, router]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;

    const next = toBounds(search);
    if (!next) return;
    if (sameViewport(next, roundBounds(map.getBounds()))) return;

    map.fitBounds(corners(next), { animate: false });
    // Leaflet applies `animate: false` synchronously, so this is the fitted viewport; recording it
    // keeps the `moveend` it just emitted from being written back as a wider box.
    fittedViewportRef.current = roundBounds(map.getBounds());
  }, [search, ready]);

  return (
    <Card className="gap-0 overflow-hidden p-0">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <p className="text-sm font-medium text-text-primary">
          {pins.length} {pins.length === 1 ? "pin" : "pins"} in view
        </p>
        <p className="flex flex-wrap items-center gap-3 text-xs text-text-muted">
          {withoutLocation > 0 ? <span>{withoutLocation} without a verified location</span> : null}
          {pinsTruncated ? <span>Zoom in to see every pin</span> : null}
          {isPending ? <span aria-live="polite">Updating map…</span> : null}
        </p>
      </div>
      {/* React must never rewrite the map container class: Leaflet adds its own classes there,
          and a pending-state class on this element wipes them, which unmaps the whole view. */}
      <div className={isPending ? "opacity-60 transition-opacity" : "transition-opacity"}>
        <div
          aria-label="Map of listings"
          className="h-[320px] w-full bg-surface-secondary md:h-[420px]"
          ref={containerRef}
          role="region"
        />
      </div>
    </Card>
  );
}
