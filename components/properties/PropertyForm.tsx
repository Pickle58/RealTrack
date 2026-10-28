"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { propertyStatusValues, type PropertyStatus } from "@/types/property";
import {
  propertyInputSchema,
  type PropertyFormValues,
  type PropertyInput,
} from "@/validations/property";

const statusLabels: Record<PropertyStatus, string> = {
  draft: "Draft",
  active: "Active",
  sold: "Sold",
  off_market: "Off market",
};

type FieldName = keyof PropertyFormValues;

export function PropertyForm({
  initial,
  mode,
}: {
  initial: PropertyFormValues;
  mode: "create" | "edit";
}) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PropertyFormValues, unknown, PropertyInput>({
    resolver: zodResolver(propertyInputSchema),
    defaultValues: initial,
    mode: "onBlur",
  });

  function fieldProps(name: FieldName) {
    return {
      "aria-describedby": errors[name] ? `${name}-error` : undefined,
      "aria-invalid": errors[name] ? true : undefined,
      id: name,
    };
  }

  function onSubmit(values: PropertyInput) {
    toast.success(mode === "create" ? "Property details look valid." : "Changes look valid.", {
      description: `${values.addressLine1}, ${values.city} was not saved — storing properties arrives in a later step.`,
    });
  }

  return (
    <form className="flex flex-col gap-6" noValidate onSubmit={handleSubmit(onSubmit)}>
      <Card className="gap-6 p-6">
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-text-primary">Address</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField error={errors.addressLine1?.message} id="addressLine1" label="Address line 1">
              <Input
                autoComplete="address-line1"
                placeholder="4821 N Hermitage Ave"
                {...register("addressLine1")}
                {...fieldProps("addressLine1")}
              />
            </FormField>

            <FormField error={errors.addressLine2?.message} id="addressLine2" label="Address line 2">
              <Input
                autoComplete="address-line2"
                placeholder="Unit, floor or suite (optional)"
                {...register("addressLine2")}
                {...fieldProps("addressLine2")}
              />
            </FormField>

            <FormField error={errors.city?.message} id="city" label="City">
              <Input
                autoComplete="address-level2"
                placeholder="Chicago"
                {...register("city")}
                {...fieldProps("city")}
              />
            </FormField>

            <FormField error={errors.stateProvince?.message} id="stateProvince" label="State or province">
              <Input
                autoComplete="address-level1"
                placeholder="IL"
                {...register("stateProvince")}
                {...fieldProps("stateProvince")}
              />
            </FormField>

            <FormField error={errors.postalCode?.message} id="postalCode" label="Postal code">
              <Input
                autoComplete="postal-code"
                placeholder="60640"
                {...register("postalCode")}
                {...fieldProps("postalCode")}
              />
            </FormField>

            <FormField
              error={errors.country?.message}
              hint="Two-letter code, e.g. US or CA."
              id="country"
              label="Country"
            >
              <Input
                autoComplete="country"
                className="uppercase"
                maxLength={2}
                placeholder="US"
                {...register("country")}
                {...fieldProps("country")}
              />
            </FormField>
          </div>
        </section>

        <div aria-hidden className="h-px bg-border" />

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-text-primary">Details</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField error={errors.bedrooms?.message} id="bedrooms" label="Bedrooms">
              <Input
                inputMode="numeric"
                min={0}
                placeholder="4"
                step={1}
                type="number"
                {...register("bedrooms")}
                {...fieldProps("bedrooms")}
              />
            </FormField>

            <FormField
              error={errors.bathrooms?.message}
              hint="Half baths use .5"
              id="bathrooms"
              label="Bathrooms"
            >
              <Input
                inputMode="decimal"
                min={0}
                placeholder="3.5"
                step={0.5}
                type="number"
                {...register("bathrooms")}
                {...fieldProps("bathrooms")}
              />
            </FormField>

            <FormField
              error={errors.price?.message}
              hint="Whole dollars, no cents."
              id="price"
              label="Price"
            >
              <div className="relative">
                <span
                  aria-hidden
                  className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-text-muted"
                >
                  $
                </span>
                <Input
                  className="pl-7"
                  inputMode="numeric"
                  min={0}
                  placeholder="450000"
                  step={1}
                  type="number"
                  {...register("price")}
                  {...fieldProps("price")}
                />
              </div>
            </FormField>
          </div>
        </section>

        <div aria-hidden className="h-px bg-border" />

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-text-primary">Status</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField error={errors.status?.message} id="status" label="Listing status">
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger
                      className="w-full"
                      onBlur={field.onBlur}
                      ref={field.ref}
                      {...fieldProps("status")}
                    >
                      <SelectValue placeholder="Choose a status" />
                    </SelectTrigger>
                    <SelectContent>
                      {propertyStatusValues.map((status) => (
                        <SelectItem key={status} value={status}>
                          {statusLabels[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
          </div>
        </section>

        <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-end">
          <Button asChild variant="ghost">
            <Link href="/dashboard">Cancel</Link>
          </Button>
          <Button disabled={isSubmitting} type="submit">
            {isSubmitting ? <Loader2 aria-hidden className="animate-spin" /> : null}
            {mode === "create" ? "Create property" : "Save changes"}
          </Button>
        </div>
      </Card>
    </form>
  );
}
