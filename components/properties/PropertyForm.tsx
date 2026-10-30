"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { startTransition, useActionState, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { createProperty, updateProperty } from "@/actions/properties";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/input";import { Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ActionResult } from "@/lib/action-result";
import {
  electricValues,
  lotSizeUnitValues,
  propertyStatusValues,
  type ElectricSupply,
  type LotSizeUnit,
  type PropertyStatus,
  type SepticSystem,
  type WaterSource,
} from "@/types/property";
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

const septicLabels: Record<SepticSystem, string> = { city: "City", tank: "Tank" };
const waterLabels: Record<WaterSource, string> = { city: "City", well: "Well" };
const electricLabels: Record<ElectricSupply, string> = {
  at_property: "At property",
  available: "Available",
  none: "None",
};
const lotSizeUnitLabels: Record<LotSizeUnit, string> = { sqft: "Square feet", acres: "Acres" };

/** Radix Select rejects an empty item value, so "not specified" needs a sentinel. */
const NOT_SPECIFIED = "not_specified";

type FieldName = keyof PropertyFormValues;

type PropertyActionState = ActionResult<{ id: string }> | null;

export function PropertyForm({
  initial,
  mode,
  propertyId,
}: {
  initial: PropertyFormValues;
  mode: "create" | "edit";
  propertyId?: string;
}) {
  const router = useRouter();
  const {
    register,
    control,
    getValues,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PropertyFormValues, unknown, PropertyInput>({
    resolver: zodResolver(propertyInputSchema),
    defaultValues: initial,
    mode: "onBlur",
  });

  const action: (prev: PropertyActionState, formData: FormData) => Promise<ActionResult<{ id: string }>> =
    mode === "create" ? createProperty : updateProperty.bind(null, propertyId ?? "");
  const [state, formAction, isPending] = useActionState<PropertyActionState, FormData>(action, null);

  useEffect(() => {
    if (!state) return;
    if (state.success) {
      toast.success(mode === "create" ? "Property created." : "Changes saved.");
      if (state.warning) toast.warning(state.warning);
      if (mode === "create") router.push("/dashboard");
      return;
    }
    toast.error(state.error);
    for (const [name, messages] of Object.entries(state.fieldErrors ?? {})) {
      if (messages?.[0]) setError(name as FieldName, { type: "server", message: messages[0] });
    }
  }, [state, mode, router, setError]);

  function fieldProps(name: FieldName, hasHint = false) {
    return {
      "aria-describedby": errors[name] ? `${name}-error` : hasHint ? `${name}-hint` : undefined,
      "aria-invalid": errors[name] ? true : undefined,
      id: name,
    };
  }

  function onSubmit() {
    const formData = new FormData();
    for (const [key, value] of Object.entries(getValues())) formData.append(key, value);
    startTransition(() => formAction(formData));
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
                {...fieldProps("country", true)}
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
                {...fieldProps("bathrooms", true)}
              />
            </FormField>

            <FormField
              error={errors.lotSize?.message}
              hint="Acres or square feet; leave blank if unknown."
              id="lotSize"
              label="Lot size"
            >
              <Input
                inputMode="decimal"
                min={0}
                placeholder="10,890"
                step="any"
                type="number"
                {...register("lotSize")}
                {...fieldProps("lotSize", true)}
              />
            </FormField>

            <FormField
              error={errors.lotSizeUnit?.message}
              id="lotSizeUnit"
              label="Lot size unit"
            >
              <Controller
                control={control}
                name="lotSizeUnit"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value ?? ""}>
                    <SelectTrigger
                      className="w-full"
                      onBlur={field.onBlur}
                      ref={field.ref}
                      {...fieldProps("lotSizeUnit")}
                    >
                      <SelectValue placeholder="Choose square feet or acres" />
                    </SelectTrigger>
                    <SelectContent>
                      {lotSizeUnitValues.map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {lotSizeUnitLabels[unit]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>

            <FormField error={errors.electric?.message} id="electric" label="Electric">
              <Controller
                control={control}
                name="electric"
                render={({ field }) => (
                  <Select
                    onValueChange={(value) =>
                      field.onChange(value === NOT_SPECIFIED ? "" : value)
                    }
                    value={field.value || NOT_SPECIFIED}
                  >
                    <SelectTrigger
                      className="w-full"
                      onBlur={field.onBlur}
                      ref={field.ref}
                      {...fieldProps("electric")}
                    >
                      <SelectValue placeholder="Choose electric service" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NOT_SPECIFIED}>Not specified</SelectItem>
                      {electricValues.map((value) => (
                        <SelectItem key={value} value={value}>
                          {electricLabels[value]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
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
                  {...fieldProps("price", true)}
                />
              </div>
            </FormField>

            <FormField error={errors.septic?.message} id="septic" label="Septic">
              <Controller
                control={control}
                name="septic"
                render={({ field }) => (
                  <Select
                    onValueChange={(value) =>
                      field.onChange(value === NOT_SPECIFIED ? "" : value)
                    }
                    value={field.value || NOT_SPECIFIED}
                  >
                    <SelectTrigger
                      className="w-full"
                      onBlur={field.onBlur}
                      ref={field.ref}
                      {...fieldProps("septic")}
                    >
                      <SelectValue placeholder="Choose city or tank" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NOT_SPECIFIED}>Not specified</SelectItem>
                      {Object.entries(septicLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>

            <FormField error={errors.water?.message} id="water" label="Water">
              <Controller
                control={control}
                name="water"
                render={({ field }) => (
                  <Select
                    onValueChange={(value) =>
                      field.onChange(value === NOT_SPECIFIED ? "" : value)
                    }
                    value={field.value || NOT_SPECIFIED}
                  >
                    <SelectTrigger
                      className="w-full"
                      onBlur={field.onBlur}
                      ref={field.ref}
                      {...fieldProps("water")}
                    >
                      <SelectValue placeholder="Choose city or well" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NOT_SPECIFIED}>Not specified</SelectItem>
                      {Object.entries(waterLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
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
          <Button disabled={isPending || isSubmitting} type="submit">
            {isPending ? <Loader2 aria-hidden className="animate-spin" /> : null}
            {mode === "create" ? "Create property" : "Save changes"}
          </Button>
        </div>
      </Card>
    </form>
  );
}
