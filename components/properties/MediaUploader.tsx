"use client";

import { useRef, useState } from "react";
import { FileText, ImageUp, Loader2, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteMedia, setCover, updateMediaAlt, uploadMedia } from "@/actions/media";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatFileSize } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { MediaItem } from "@/types/media";
import {
  MAX_MEDIA_BYTES,
  MAX_MEDIA_PER_PROPERTY,
  MEDIA_ACCEPT,
  isAllowedMediaType,
  isImageMedia,
} from "@/validations/media";

type UploadEntry = {
  key: string;
  name: string;
  pending: boolean;
  error: string | null;
};

function fileError(file: File): string | null {
  if (file.size === 0) return "That file is empty.";
  if (file.size > MAX_MEDIA_BYTES) return "Files must be 10 MB or smaller.";
  if (!isAllowedMediaType(file.type)) return "Use a JPEG, PNG, WebP, or PDF file.";
  return null;
}

function mediaLabel(item: MediaItem): string {
  return isImageMedia(item.mimeType) ? "Photo" : "Document";
}

export function MediaUploader({
  propertyId,
  items: initialItems,
}: {
  propertyId: string;
  items: MediaItem[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<MediaItem[]>(initialItems);
  const [uploads, setUploads] = useState<UploadEntry[]>([]);
  const [dragging, setDragging] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const pendingCount = uploads.filter((entry) => entry.pending).length;
  const atLimit = items.length + pendingCount >= MAX_MEDIA_PER_PROPERTY;

  async function handleFiles(files: File[]): Promise<void> {
    for (const file of files) {
      const key = `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const localError = fileError(file);
      setUploads((prev) => [
        ...prev,
        { key, name: file.name, pending: localError === null, error: localError },
      ]);
      if (localError !== null) continue;

      const formData = new FormData();
      formData.set("file", file);

      let failure: string | null = null;
      try {
        const result = await uploadMedia(propertyId, formData);
        if (result.success) {
          setItems((prev) => [...prev, result.data]);
          setUploads((prev) => prev.filter((entry) => entry.key !== key));
          continue;
        }
        failure = result.error;
      } catch (error) {
        console.error("[MediaUploader/upload]", error);
        failure = "Upload failed. Please try again.";
      }

      setUploads((prev) =>
        prev.map((entry) => (entry.key === key ? { ...entry, pending: false, error: failure } : entry)),
      );
    }
  }

  async function saveAlt(item: MediaItem, value: string): Promise<void> {
    if (value.trim() === (item.altText ?? "")) return;
    try {
      const result = await updateMediaAlt(item.id, value);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setItems((prev) => prev.map((entry) => (entry.id === result.data.id ? result.data : entry)));
    } catch (error) {
      console.error("[MediaUploader/updateMediaAlt]", error);
      toast.error("Could not save the alt text. Please try again.");
    }
  }

  async function makeCover(item: MediaItem): Promise<void> {
    setBusyId(item.id);
    try {
      const result = await setCover(item.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setItems((prev) => prev.map((entry) => ({ ...entry, isCover: entry.id === item.id })));
    } catch (error) {
      console.error("[MediaUploader/setCover]", error);
      toast.error("Could not set the cover. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  async function removeItem(item: MediaItem): Promise<void> {
    setBusyId(item.id);
    try {
      const result = await deleteMedia(item.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      const remaining = items.filter((entry) => entry.id !== item.id);
      // The server promotes the next photo when the cover goes; the list is ordered cover-first.
      const promoted = item.isCover
        ? remaining.find((entry) => isImageMedia(entry.mimeType))
        : undefined;
      setItems(
        promoted
          ? [{ ...promoted, isCover: true }, ...remaining.filter((entry) => entry.id !== promoted.id)]
          : remaining,
      );
    } catch (error) {
      console.error("[MediaUploader/deleteMedia]", error);
      toast.error("Could not delete the file. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Card className="gap-4 p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-text-primary">Photos and documents</h2>
        <p className="text-sm text-text-secondary">
          The cover photo is the first image on the listing. {items.length} of {MAX_MEDIA_PER_PROPERTY}{" "}
          files used.
        </p>
      </div>

      <div
        className={cn(
          "flex flex-col items-center gap-2 rounded-lg border border-dashed px-6 py-10 text-center",
          dragging ? "border-accent bg-accent-light" : "border-border bg-surface-secondary",
        )}
        onDragLeave={() => setDragging(false)}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void handleFiles(Array.from(event.dataTransfer.files));
        }}
      >
        <ImageUp aria-hidden className="size-8 text-text-muted" />
        <p className="text-sm font-medium text-text-primary">Drop photos or PDFs here</p>
        <p className="max-w-sm text-xs text-text-muted">
          JPEG, PNG, WebP, or PDF. Up to 10 MB each, {MAX_MEDIA_PER_PROPERTY} files per property.
        </p>
        <Button
          disabled={atLimit}
          onClick={() => inputRef.current?.click()}
          size="sm"
          type="button"
          variant="secondary"
        >
          Choose files
        </Button>
        <input
          accept={MEDIA_ACCEPT}
          aria-label="Upload photos and documents"
          className="sr-only"
          multiple
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            event.target.value = "";
            void handleFiles(files);
          }}
          ref={inputRef}
          type="file"
        />
        {atLimit ? (
          <p className="text-xs text-text-muted">This property has reached its file limit.</p>
        ) : null}
      </div>

      {uploads.length > 0 ? (
        <ul aria-live="polite" className="flex flex-col gap-2">
          {uploads.map((entry) => (
            <li
              className="flex items-start justify-between gap-3 rounded-md border border-border px-3 py-2"
              key={entry.key}
            >
              <div className="flex min-w-0 items-center gap-2">
                {entry.pending ? (
                  <Loader2 aria-hidden className="size-4 animate-spin text-text-muted" />
                ) : (
                  <FileText aria-hidden className="size-4 text-text-muted" />
                )}
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm text-text-primary">{entry.name}</span>
                  <span className={entry.error ? "text-xs text-error" : "text-xs text-text-muted"}>
                    {entry.error ?? "Uploading…"}
                  </span>
                </div>
              </div>
              {entry.pending ? null : (
                <Button
                  aria-label={`Dismiss ${entry.name}`}
                  onClick={() =>
                    setUploads((prev) => prev.filter((candidate) => candidate.key !== entry.key))
                  }
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  Dismiss
                </Button>
              )}
            </li>
          ))}
        </ul>
      ) : null}

      {items.length === 0 ? (
        <p className="text-xs text-text-muted">No photos yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <li
              className="flex flex-col gap-3 rounded-lg border border-border p-3 lg:flex-row lg:items-center"
              key={item.id}
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                {isImageMedia(item.mimeType) ? (
                  <img
                    alt={item.altText ?? ""}
                    className="size-16 shrink-0 rounded-md border border-border object-cover"
                    src={item.src}
                  />
                ) : (
                  <span className="flex size-16 shrink-0 items-center justify-center rounded-md border border-border bg-surface-secondary">
                    <FileText aria-hidden className="size-6 text-text-muted" />
                    <span className="sr-only">Document</span>
                  </span>
                )}

                <div className="flex min-w-0 flex-col gap-1">
                  <span className="flex flex-wrap items-center gap-2 text-sm font-medium text-text-primary">
                    {mediaLabel(item)}
                    {item.isCover ? (
                      <Badge className="bg-accent-light text-accent" variant="ghost">
                        Cover
                      </Badge>
                    ) : null}
                  </span>
                  <span className="text-xs text-text-muted">
                    {formatFileSize(item.sizeBytes)} · {item.mimeType}
                  </span>
                </div>
              </div>

              <div className="w-full lg:max-w-xs">
                {isImageMedia(item.mimeType) ? (
                  <>
                    <label className="sr-only" htmlFor={`alt-${item.id}`}>
                      Alt text for this photo
                    </label>
                    <Input
                      defaultValue={item.altText ?? ""}
                      id={`alt-${item.id}`}
                      onBlur={(event) => void saveAlt(item, event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          event.currentTarget.blur();
                        }
                      }}
                      placeholder="Describe this photo for screen readers"
                    />
                  </>
                ) : (
                  <p className="text-xs text-text-muted">
                    Documents appear in the listing&apos;s Documents section.
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1 lg:justify-end">
                {item.isCover || !isImageMedia(item.mimeType) ? null : (
                  <Button
                    aria-label="Set this photo as the cover"
                    disabled={busyId === item.id}
                    onClick={() => void makeCover(item)}
                    size="icon-sm"
                    type="button"
                    variant="ghost"
                  >
                    {busyId === item.id ? (
                      <Loader2 aria-hidden className="animate-spin" />
                    ) : (
                      <Star aria-hidden />
                    )}
                  </Button>
                )}

                <ConfirmDialog
                  confirmLabel="Delete file"
                  description="This removes the file from the property and storage. This cannot be undone."
                  onConfirm={() => void removeItem(item)}
                  title={`Delete this ${mediaLabel(item).toLowerCase()}?`}
                  trigger={
                    <Button
                      aria-label={`Delete this ${mediaLabel(item).toLowerCase()}`}
                      disabled={busyId === item.id}
                      size="icon-sm"
                      type="button"
                      variant="ghost"
                    >
                      <Trash2 aria-hidden />
                    </Button>
                  }
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
