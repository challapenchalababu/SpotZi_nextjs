"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { OfferPoster } from "@/components/customer/poster";
import { ImageField } from "@/components/forms/image-field";
import { Button, Field, Notice, fieldClass } from "@/components/ui/primitives";
import { api } from "@/lib/api-client";
import { WEEKDAYS, type BranchDTO, type BusinessDTO, type OfferType, type TemplateDTO } from "@/types/domain";
import { createOfferSchema, type CreateOfferInput } from "@/validators";

const steps = ["Place", "Template", "Details", "Preview"] as const;

export function OfferWizard({ templateId }: { templateId?: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [businesses, setBusinesses] = useState<BusinessDTO[]>([]);
  const [branches, setBranches] = useState<BranchDTO[]>([]);
  const [branchesFor, setBranchesFor] = useState("");
  const [templates, setTemplates] = useState<TemplateDTO[]>([]);
  const form = useForm<CreateOfferInput>({
    resolver: zodResolver(createOfferSchema) as Resolver<CreateOfferInput>,
    defaultValues: {
      businessId: "",
      branchIds: [],
      templateId: templateId ?? "",
      title: "",
      description: "",
      offerType: "percentage",
      posterUrl: "",
      validFrom: "",
      validUntil: "",
      activeDays: [],
      startTime: "",
      endTime: "",
      timezone: "Asia/Kolkata",
      termsAndConditions: "",
      status: "draft",
    },
  });
  const businessId = useWatch({ control: form.control, name: "businessId" });
  const templateValue = useWatch({ control: form.control, name: "templateId" });
  const values = useWatch({ control: form.control });
  const selectedTemplate = templates.find((template) => template.id === templateValue);

  useEffect(() => {
    api<BusinessDTO[]>("/api/businesses?mine=true").then((items) => {
      setBusinesses(items);
      if (!form.getValues("businessId") && items[0]) form.setValue("businessId", items[0].id);
    }).catch((caught: unknown) => setError(caught instanceof Error ? caught.message : "Could not load businesses."));
    api<TemplateDTO[]>("/api/templates").then(setTemplates).catch(() => setTemplates([]));
  }, [form]);

  useEffect(() => {
    if (!businessId) return;
    api<BranchDTO[]>(`/api/branches?businessId=${businessId}`).then((items) => {
      setBranches(items);
      setBranchesFor(businessId);
    }).catch(() => {
      setBranches([]);
      setBranchesFor(businessId);
    });
  }, [businessId]);

  async function next() {
    const fields: Array<keyof CreateOfferInput> = step === 0 ? ["businessId", "branchIds"] : step === 1 ? ["templateId"] : ["title", "description", "offerType", "validFrom", "validUntil", "timezone"];
    const valid = await form.trigger(fields);
    if (valid) setStep((value) => Math.min(value + 1, steps.length - 1));
  }

  async function save(status: "draft" | "published") {
    form.setValue("status", status);
    await form.handleSubmit(async (values) => {
      setError(null);
      try {
        const created = await api<Array<{ id: string }>>("/api/offers", { method: "POST", body: JSON.stringify({ ...values, status }) });
        router.push(created[0] ? `/owner/offers/${created[0].id}` : "/owner/offers");
        router.refresh();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not save the offer.");
      }
    })();
  }

  const branch = branches.find((item) => values.branchIds?.includes(item.id));

  return (
    <div className="space-y-6">
      <ol className="flex flex-wrap gap-2 text-sm">
        {steps.map((label, index) => <li key={label} className={index === step ? "font-semibold text-primary" : "text-muted-foreground"}>{index + 1}. {label}</li>)}
      </ol>
      {error ? <Notice tone="warning">{error}</Notice> : null}
      {businesses.length === 0 ? <Notice tone="warning">Create a business and a branch with its location before publishing an offer. <Link className="font-semibold text-primary" href="/owner/businesses/create">Add a business</Link></Notice> : null}
      {businesses.length > 0 && businessId && branchesFor === businessId && branches.length === 0 ? <Notice tone="warning">This business has no branch yet. <Link className="font-semibold text-primary" href="/owner/branches/create">Add a location</Link></Notice> : null}
      {step === 0 ? (
        <div className="space-y-4">
          <Field label="Business" error={form.formState.errors.businessId?.message}>
            <select className={fieldClass} {...form.register("businessId")}>{businesses.map((business) => <option key={business.id} value={business.id}>{business.businessName}</option>)}</select>
          </Field>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Branches</legend>
            {branches.map((item) => (
              <label key={item.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" value={item.id} checked={values.branchIds?.includes(item.id)} onChange={(event) => {
                  const current = new Set(form.getValues("branchIds"));
                  if (event.target.checked) current.add(item.id);
                  else current.delete(item.id);
                  form.setValue("branchIds", [...current], { shouldValidate: true });
                }} />
                {item.branchName} · {item.address.area}, {item.address.city}
              </label>
            ))}
            {form.formState.errors.branchIds ? <p className="text-xs text-danger">{form.formState.errors.branchIds.message}</p> : null}
            <p className="text-xs text-muted-foreground">The same promotion is saved as one offer per selected branch, each with that branch&apos;s location.</p>
          </fieldset>
        </div>
      ) : null}
      {step === 1 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {templates.map((template) => (
            <button type="button" key={template.id} className={`rounded-2xl border p-2 text-left ${values.templateId === template.id ? "border-primary" : "border-border"}`} onClick={() => form.setValue("templateId", template.id, { shouldValidate: true })}>
              <div className="h-40 overflow-hidden rounded-xl">
                <OfferPoster title="Your offer" businessName="Your business" discountLabel="20% off" layout={template.layoutConfig} backgroundUrl={template.backgroundUrl} />
              </div>
              <p className="mt-2 font-medium">{template.name}</p>
            </button>
          ))}
          {templates.length === 0 ? <Notice>No active templates yet. A super admin needs to add one.</Notice> : null}
        </div>
      ) : null}
      {step === 2 ? (
        <div className="grid gap-4">
          <Field label="Title" error={form.formState.errors.title?.message}><input className={fieldClass} {...form.register("title")} /></Field>
          <Field label="Description" error={form.formState.errors.description?.message}><textarea className={fieldClass} rows={4} {...form.register("description")} /></Field>
          <Field label="Offer type" error={form.formState.errors.offerType?.message}>
            <select className={fieldClass} {...form.register("offerType")}>
              {(["percentage", "flat", "bogo", "special"] as OfferType[]).map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </Field>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Discount value"><input className={fieldClass} type="number" step="any" {...form.register("discountValue", { valueAsNumber: true })} /></Field>
            <Field label="Original price"><input className={fieldClass} type="number" step="any" {...form.register("originalPrice", { valueAsNumber: true })} /></Field>
            <Field label="Discounted price"><input className={fieldClass} type="number" step="any" {...form.register("discountedPrice", { valueAsNumber: true })} /></Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Valid from" error={form.formState.errors.validFrom?.message}><input className={fieldClass} type="date" {...form.register("validFrom")} /></Field>
            <Field label="Valid until" error={form.formState.errors.validUntil?.message}><input className={fieldClass} type="date" {...form.register("validUntil")} /></Field>
            <Field label="Daily start"><input className={fieldClass} type="time" {...form.register("startTime")} /></Field>
            <Field label="Daily end"><input className={fieldClass} type="time" {...form.register("endTime")} /></Field>
          </div>
          <Field label="Time zone" error={form.formState.errors.timezone?.message}>
            <select className={fieldClass} {...form.register("timezone")}>
              {["Asia/Kolkata", "Asia/Dubai", "Asia/Singapore", "Europe/London", "America/New_York", "UTC"].map((zone) => <option key={zone}>{zone}</option>)}
            </select>
          </Field>
          <fieldset className="flex flex-wrap gap-3 text-sm">
            <legend className="mb-2 w-full font-medium">Applicable days</legend>
            {WEEKDAYS.map((day) => (
              <label key={day} className="capitalize"><input type="checkbox" value={day} checked={values.activeDays?.includes(day)} onChange={(event) => {
                const current = new Set(form.getValues("activeDays"));
                if (event.target.checked) current.add(day);
                else current.delete(day);
                form.setValue("activeDays", [...current]);
              }} /> {day}</label>
            ))}
          </fieldset>
          <Field label="Redemption limit"><input className={fieldClass} type="number" {...form.register("redemptionLimit", { valueAsNumber: true })} /></Field>
          <Field label="Terms and conditions" error={form.formState.errors.termsAndConditions?.message}><textarea className={fieldClass} rows={4} {...form.register("termsAndConditions")} /></Field>
          <ImageField label="Optional poster upload" value={values.posterUrl || ""} onChange={(url) => form.setValue("posterUrl", url)} />
        </div>
      ) : null}
      {step === 3 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-80 overflow-hidden rounded-2xl">
            <OfferPoster
              title={values.title || "Offer title"}
              businessName={businesses.find((item) => item.id === values.businessId)?.businessName || "Business"}
              discountLabel={values.offerType === "percentage" ? `${values.discountValue || 0}% off` : values.offerType === "flat" ? `Flat ${values.discountValue || 0} off` : values.offerType === "bogo" ? "Buy 1, get 1" : "Special offer"}
              address={branch ? `${branch.address.area}, ${branch.address.city}` : undefined}
              validUntil={values.validUntil ? new Date(values.validUntil).toISOString() : undefined}
              originalPrice={values.originalPrice}
              discountedPrice={values.discountedPrice}
              layout={selectedTemplate?.layoutConfig}
              backgroundUrl={values.posterUrl || selectedTemplate?.backgroundUrl}
            />
          </div>
          <div className="space-y-3 text-sm">
            <p>{values.description}</p>
            <p>{values.branchIds?.length || 0} branch{values.branchIds?.length === 1 ? "" : "es"} selected.</p>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={() => save("draft")}>Save draft</Button>
              <Button type="button" onClick={() => save("published")}>Publish</Button>
            </div>
          </div>
        </div>
      ) : null}
      <div className="flex gap-2">
        {step > 0 ? <Button type="button" variant="ghost" onClick={() => setStep((value) => value - 1)}>Back</Button> : null}
        {step < 3 ? <Button type="button" onClick={next}>Continue</Button> : null}
      </div>
    </div>
  );
}
