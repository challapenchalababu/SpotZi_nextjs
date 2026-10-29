"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { ImageField } from "@/components/forms/image-field";
import { Button, Field, Notice, fieldClass } from "@/components/ui/primitives";
import { api } from "@/lib/api-client";
import { businessSchema, type BusinessInput } from "@/validators";
import type { BusinessDTO, CategoryDTO } from "@/types/domain";

export function BusinessForm({ categories, business }: { categories: CategoryDTO[]; business?: BusinessDTO }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<BusinessInput>({
    resolver: zodResolver(businessSchema),
    defaultValues: {
      businessName: business?.businessName ?? "",
      category: business?.category ?? categories[0]?.slug ?? "",
      description: business?.description ?? "",
      logoUrl: business?.logoUrl ?? "",
      contactPhone: business?.contactPhone ?? "",
      website: business?.website ?? "",
      isActive: business?.isActive ?? true,
    },
  });
  const logoUrl = useWatch({ control: form.control, name: "logoUrl" });

  return (
    <form className="max-w-2xl space-y-4" onSubmit={form.handleSubmit(async (values) => {
      setError(null);
      try {
        const saved = business
          ? await api<BusinessDTO>(`/api/businesses/${business.id}`, { method: "PATCH", body: JSON.stringify(values) })
          : await api<BusinessDTO>("/api/businesses", { method: "POST", body: JSON.stringify(values) });
        router.push(`/owner/businesses/${saved.id}`);
        router.refresh();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not save the business.");
      }
    })}>
      {error ? <Notice tone="warning">{error}</Notice> : null}
      <Field label="Business name" error={form.formState.errors.businessName?.message}><input className={fieldClass} {...form.register("businessName")} /></Field>
      <Field label="Category" error={form.formState.errors.category?.message}>
        <select className={fieldClass} {...form.register("category")}>
          {categories.map((category) => <option key={category.id} value={category.slug}>{category.name}</option>)}
        </select>
      </Field>
      <Field label="Description" error={form.formState.errors.description?.message}><textarea className={fieldClass} rows={5} {...form.register("description")} /></Field>
      <Field label="Phone" error={form.formState.errors.contactPhone?.message}><input className={fieldClass} {...form.register("contactPhone")} /></Field>
      <Field label="Website" error={form.formState.errors.website?.message}><input className={fieldClass} placeholder="https://" {...form.register("website")} /></Field>
      <ImageField label="Logo" value={logoUrl || ""} onChange={(url) => form.setValue("logoUrl", url)} />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...form.register("isActive")} /> Business is active</label>
      <Button type="submit" disabled={form.formState.isSubmitting}>{business ? "Save changes" : "Create business"}</Button>
    </form>
  );
}
