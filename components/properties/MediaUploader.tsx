import { ImageUp } from "lucide-react";
import { Card } from "@/components/ui/card";

export function MediaUploader() {
  return (
    <Card className="gap-4 p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-text-primary">Photos and documents</h2>
        <p className="text-sm text-text-secondary">
          The cover photo is the first image on the listing.
        </p>
      </div>

      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-surface-secondary px-6 py-10 text-center">
        <ImageUp aria-hidden className="size-8 text-text-muted" />
        <p className="text-sm font-medium text-text-primary">Uploads are not enabled yet.</p>
        <p className="max-w-sm text-xs text-text-muted">
          Drag-and-drop photos and PDFs will appear here once media storage is connected.
        </p>
      </div>
    </Card>
  );
}
