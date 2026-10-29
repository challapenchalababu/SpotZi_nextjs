"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { ImageField } from "@/components/forms/image-field";
import { Button, Field, Notice, fieldClass } from "@/components/ui/primitives";
import { api } from "@/lib/api-client";
import { getZonedParts } from "@/lib/time";
import { WEEKDAYS, type BranchDTO, type BusinessDTO, type ManagedOfferDTO, type TemplateDTO } from "@/types/domain";
import { updateOfferSchema, type UpdateOfferInput } from "@/validators";

export function OfferEditForm({
  offer,
  businesses,
  branches,
  templates,
}: {
  offer: ManagedOfferDTO;
  businesses: BusinessDTO[];
  branches: BranchDTO[];
  templates: TemplateDTO[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const defaults = useMemo<UpdateOfferInput>(() => ({
    businessId: offer.businessId,
    branchId: offer.branchId,
    templateId: offer.templateId || templates[0]?.id || "",
    title: offer.title,
    description: offer.description,
    offerType: offer.offerType,
    discountValue: offer.discountValue,
    originalPrice: offer.originalPrice,
    discountedPrice: offer.discountedPrice,
    posterUrl: offer.posterUrl || "",
    validFrom: getZonedParts(new Date(offer.validFrom), offer.timezone).dateKey,
    validUntil: getZonedParts(new Date(offer.validUntil), offer.timezone).dateKey,
    activeDays: offer.activeDays,
    startTime: offer.startTime || "",
    endTime: offer.endTime || "",
    timezone: offer.timezone,
    termsAndConditions: offer.termsAndConditions || "",
    redemptionLimit: offer.redemptionLimit,
    status: offer.status === "published" ? "published" : "draft",
  }), [offer, templates]);
  const form = useForm<UpdateOfferInput>({ resolver: zodResolver(updateOfferSchema) as Resolver<UpdateOfferInput>, defaultValues: defaults });
  const businessId = useWatch({ control: form.control, name: "businessId" });
  const posterUrl = useWatch({ control: form.control, name: "posterUrl" });
  const status = useWatch({ control: form.control, name: "status" });
  const visibleBranches = branches.filter((branch) => branch.businessId === businessId);

  return (
    <form className="max-w-3xl space-y-4" onSubmit={form.handleSubmit(async (values) => {
      setError(null);
      try {
        await api(`/api/offers/${offer.id}`, { method: "PATCH", body: JSON.stringify(values) });
        router.push(`/owner/offers/${offer.id}`);
        router.refresh();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not save the offer.");
      }
    })}>
      {error ? <Notice tone="warning">{error}</Notice> : null}
      {offer.status === "paused" || offer.status === "archived" ? <Notice>This offer is {offer.status}. Saving it as a draft keeps it off the public site until you publish it again.</Notice> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Business" error={form.formState.errors.businessId?.message}>
          <select className={fieldClass} {...form.register("businessId")}>{businesses.map((business) => <option key={business.id} value={business.id}>{business.businessName}</option>)}</select>
        </Field>
        <Field label="Branch" error={form.formState.errors.branchId?.message}>
          <select className={fieldClass} {...form.register("branchId")}>{visibleBranches.map((branch) => <option key={branch.id} value={branch.id}>{branch.branchName}</option>)}</select>
        </Field>
        <Field label="Template" error={form.formState.errors.templateId?.message}>
          <select className={fieldClass} {...form.register("templateId")}>{templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}</select>
        </Field>
        <Field label="Type">
          <select className={fieldClass} {...form.register("offerType")}>
            <option value="percentage">Percentage</option>
            <option value="flat">Flat amount</option>
            <option value="bogo">Buy one, get one</option>
            <option value="special">Special offer</option>
          </select>
        </Field>
      </div>
      <Field label="Title" error={form.formState.errors.title?.message}><input className={fieldClass} {...form.register("title")} /></Field>
      <Field label="Description" error={form.formState.errors.description?.message}><textarea className={fieldClass} rows={4} {...form.register("description")} /></Field>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Discount value"><input className={fieldClass} type="number" {...form.register("discountValue", { setValueAs: emptyNumber })} /></Field>
        <Field label="Original price"><input className={fieldClass} type="number" {...form.register("originalPrice", { setValueAs: emptyNumber })} /></Field>
        <Field label="Discounted price"><input className={fieldClass} type="number" {...form.register("discountedPrice", { setValueAs: emptyNumber })} /></Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Valid from" error={form.formState.errors.validFrom?.message}><input className={fieldClass} type="date" {...form.register("validFrom")} /></Field>
        <Field label="Valid until" error={form.formState.errors.validUntil?.message}><input className={fieldClass} type="date" {...form.register("validUntil")} /></Field>
        <Field label="Start time"><input className={fieldClass} type="time" {...form.register("startTime")} /></Field>
        <Field label="End time" error={form.formState.errors.endTime?.message}><input className={fieldClass} type="time" {...form.register("endTime")} /></Field>
      </div>
      <fieldset>
        <legend className="text-sm font-medium">Applicable days</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {WEEKDAYS.map((day) => (
            <label key={day} className="rounded-full border border-border px-3 py-1 text-sm capitalize">
              <input className="mr-2" type="checkbox" value={day} {...form.register("activeDays")} />{day}
            </label>
          ))}
        </div>
      </fieldset>
      <Field label="Terms" error={form.formState.errors.termsAndConditions?.message}><textarea className={fieldClass} rows={3} {...form.register("termsAndConditions")} /></Field>
      <Field label="Redemption limit"><input className={fieldClass} type="number" {...form.register("redemptionLimit", { setValueAs: emptyNumber })} /></Field>
      <Field label="Time zone"><input className={fieldClass} {...form.register("timezone")} /></Field>
      <ImageField label="Poster" value={posterUrl || ""} onChange={(url) => form.setValue("posterUrl", url)} />
      <div className="flex gap-2">
        <Button type="button" variant="secondary" onClick={() => form.setValue("status", "draft")}>Mark as draft</Button>
        <Button type="button" onClick={() => form.setValue("status", "published")}>Mark as published</Button>
        <Button type="submit">{status === "published" ? "Save and publish" : "Save draft"}</Button>
      </div>
    </form>
  );
}

function emptyNumber(value: string) {
  if (value === "") return undefined;
  const number = Number(value);
  return Number.isNaN(number) ? undefined : number;
}
