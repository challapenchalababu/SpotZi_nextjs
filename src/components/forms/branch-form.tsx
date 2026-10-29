"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { Button, Field, Notice, fieldClass } from "@/components/ui/primitives";
import { api } from "@/lib/api-client";
import { defaultOpeningHours } from "@/lib/hours";
import { WEEKDAYS, type BranchDTO, type BusinessDTO } from "@/types/domain";
import { branchSchema, type BranchInput } from "@/validators";

export function BranchForm({ businesses, branch }: { businesses: BusinessDTO[]; branch?: BranchDTO }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const hours = branch?.openingHours ?? defaultOpeningHours();
  const form = useForm<BranchInput>({
    resolver: zodResolver(branchSchema) as Resolver<BranchInput>,
    defaultValues: {
      businessId: branch?.businessId ?? businesses[0]?.id ?? "",
      branchName: branch?.branchName ?? "",
      address: {
        line1: branch?.address.line1 ?? "",
        line2: branch?.address.line2 ?? "",
        area: branch?.address.area ?? "",
        city: branch?.address.city ?? "",
        state: branch?.address.state ?? "",
        pincode: branch?.address.pincode ?? "",
        country: branch?.address.country ?? "India",
      },
      latitude: branch?.latitude ?? ("" as unknown as number),
      longitude: branch?.longitude ?? ("" as unknown as number),
      phone: branch?.phone ?? "",
      openingHours: hours,
      isActive: branch?.isActive ?? true,
    },
  });

  function fillFromBrowser() {
    navigator.geolocation.getCurrentPosition((position) => {
      form.setValue("latitude", Number(position.coords.latitude.toFixed(6)));
      form.setValue("longitude", Number(position.coords.longitude.toFixed(6)));
    });
  }

  return (
    <form className="max-w-3xl space-y-4" onSubmit={form.handleSubmit(async (values) => {
      setError(null);
      try {
        const saved = branch
          ? await api<BranchDTO>(`/api/branches/${branch.id}`, { method: "PATCH", body: JSON.stringify(values) })
          : await api<BranchDTO>("/api/branches", { method: "POST", body: JSON.stringify(values) });
        router.push("/owner/branches");
        router.refresh();
        void saved;
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not save the branch.");
      }
    })}>
      {error ? <Notice tone="warning">{error}</Notice> : null}
      <Field label="Business" error={form.formState.errors.businessId?.message}>
        <select className={fieldClass} {...form.register("businessId")}>
          {businesses.map((business) => <option key={business.id} value={business.id}>{business.businessName}</option>)}
        </select>
      </Field>
      <Field label="Branch name" error={form.formState.errors.branchName?.message}><input className={fieldClass} {...form.register("branchName")} /></Field>
      <Field label="Address line" error={form.formState.errors.address?.line1?.message}><input className={fieldClass} {...form.register("address.line1")} /></Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Area" error={form.formState.errors.address?.area?.message}><input className={fieldClass} {...form.register("address.area")} /></Field>
        <Field label="City" error={form.formState.errors.address?.city?.message}><input className={fieldClass} {...form.register("address.city")} /></Field>
        <Field label="State"><input className={fieldClass} {...form.register("address.state")} /></Field>
        <Field label="Pincode" error={form.formState.errors.address?.pincode?.message}><input className={fieldClass} {...form.register("address.pincode")} /></Field>
        <Field label="Country"><input className={fieldClass} {...form.register("address.country")} /></Field>
        <Field label="Phone"><input className={fieldClass} {...form.register("phone")} /></Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Latitude" error={form.formState.errors.latitude?.message}><input className={fieldClass} step="any" type="number" {...form.register("latitude", { valueAsNumber: true })} /></Field>
        <Field label="Longitude" error={form.formState.errors.longitude?.message}><input className={fieldClass} step="any" type="number" {...form.register("longitude", { valueAsNumber: true })} /></Field>
      </div>
      <Button type="button" variant="secondary" onClick={fillFromBrowser}>Use this device&apos;s location for the shop</Button>
      <p className="text-xs text-muted-foreground">Coordinates are stored as longitude, latitude and power nearby search. You can copy them from a map if you are not at the shop.</p>
      <div className="space-y-2">
        <p className="text-sm font-medium">Opening hours</p>
        {WEEKDAYS.map((day) => (
          <div key={day} className="grid grid-cols-[8rem_auto_1fr_1fr] items-center gap-2 text-sm">
            <span className="capitalize">{day}</span>
            <label className="flex items-center gap-1"><input type="checkbox" {...form.register(`openingHours.${day}.closed`)} />Closed</label>
            <input className={fieldClass} {...form.register(`openingHours.${day}.open`)} />
            <input className={fieldClass} {...form.register(`openingHours.${day}.close`)} />
          </div>
        ))}
      </div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...form.register("isActive")} /> Branch is active</label>
      <Button type="submit" disabled={form.formState.isSubmitting}>{branch ? "Save branch" : "Add branch"}</Button>
    </form>
  );
}
