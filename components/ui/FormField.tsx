import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function FormField({
  id,
  label,
  error,
  hint,
  className,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label className="text-text-secondary" htmlFor={id}>
        {label}
      </Label>
      {children}
      {hint && !error ? (
        <p className="text-xs text-text-muted" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="text-xs text-error" id={`${id}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
