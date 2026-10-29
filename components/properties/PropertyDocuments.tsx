import { Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatFileSize } from "@/lib/format";
import type { PropertyDocument } from "@/types/property";

/** No filename is stored, so the download name is derived from the listing address. */
function downloadName(address: string, index: number, total: number): string {
  const slug =
    address
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "property";

  return total > 1 ? `${slug}-document-${index + 1}.pdf` : `${slug}-document.pdf`;
}

export function PropertyDocuments({
  documents,
  address,
}: {
  documents: PropertyDocument[];
  address: string;
}) {
  if (documents.length === 0) return null;

  return (
    <Card className="gap-4 p-6">
      <h2 className="text-lg font-semibold text-text-primary">Documents</h2>
      <ul className="flex flex-col gap-2">
        {documents.map((document, index) => {
          const name = downloadName(address, index, documents.length);

          return (
            <li
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3"
              key={document.id}
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-surface-secondary">
                  <FileText aria-hidden className="size-5 text-text-muted" />
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium text-text-primary">{name}</span>
                  <span className="text-xs text-text-muted">
                    PDF · {formatFileSize(document.sizeBytes)}
                  </span>
                </span>
              </span>

              <Button asChild size="sm" variant="secondary">
                <a aria-label={`Download ${name}`} download={name} href={document.src}>
                  <Download aria-hidden />
                  Download
                </a>
              </Button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
