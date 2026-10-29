"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { ImageField } from "@/components/forms/image-field";
import { Button, Field, Notice, fieldClass } from "@/components/ui/primitives";
import { api } from "@/lib/api-client";
import type { CategoryDTO, TemplateDTO } from "@/types/domain";
import { categorySchema, templateSchema } from "@/validators";

export function CategoryForm({ category }: { category?: CategoryDTO }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const form = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name ?? "",
      icon: category?.icon ?? "store",
      description: category?.description ?? "",
      isActive: category?.isActive ?? true,
      sortOrder: category?.sortOrder ?? 0,
    },
  });
  return (
    <form className="max-w-xl space-y-4" onSubmit={form.handleSubmit(async (values) => {
      setError(null);
      try {
        if (category) await api(`/api/categories/${category.id}`, { method: "PATCH", body: JSON.stringify(values) });
        else await api("/api/categories", { method: "POST", body: JSON.stringify(values) });
        router.push("/super-admin/categories");
        router.refresh();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not save the category.");
      }
    })}>
      {error ? <Notice tone="warning">{error}</Notice> : null}
      <Field label="Name" error={form.formState.errors.name?.message}><input className={fieldClass} {...form.register("name")} /></Field>
      <Field label="Icon key" error={form.formState.errors.icon?.message}>
        <select className={fieldClass} {...form.register("icon")}>
          {["utensils", "coffee", "basket", "scissors", "bag", "pill", "croissant", "dumbbell", "store"].map((icon) => <option key={icon}>{icon}</option>)}
        </select>
      </Field>
      <Field label="Description" error={form.formState.errors.description?.message}><textarea className={fieldClass} rows={3} {...form.register("description")} /></Field>
      <Field label="Sort order"><input className={fieldClass} type="number" {...form.register("sortOrder", { valueAsNumber: true })} /></Field>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...form.register("isActive")} /> Active</label>
      <Button type="submit">{category ? "Save category" : "Create category"}</Button>
    </form>
  );
}

export function TemplateForm({ template }: { template?: TemplateDTO }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const form = useForm({
    resolver: zodResolver(templateSchema),
    defaultValues: template ?? {
      name: "",
      category: "all",
      thumbnailUrl: "",
      backgroundUrl: "",
      availableFields: ["title", "discount", "price", "validity", "address"],
      isActive: true,
      layoutConfig: {
        layout: "classic" as const,
        backgroundColor: "#143f3b",
        textColor: "#f7f3ea",
        accentColor: "#e25b2a",
        mutedColor: "#d7efe9",
        fontFamily: "serif" as const,
        logoPosition: "top-left" as const,
        showAddress: true,
        showValidity: true,
        showPrices: true,
      },
    },
  });
  const backgroundUrl = useWatch({ control: form.control, name: "backgroundUrl" });
  const thumbnailUrl = useWatch({ control: form.control, name: "thumbnailUrl" });
  return (
    <form className="max-w-2xl space-y-4" onSubmit={form.handleSubmit(async (values) => {
      setError(null);
      try {
        if (template) await api(`/api/templates/${template.id}`, { method: "PATCH", body: JSON.stringify(values) });
        else await api("/api/templates", { method: "POST", body: JSON.stringify(values) });
        router.push("/super-admin/templates");
        router.refresh();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not save the template.");
      }
    })}>
      {error ? <Notice tone="warning">{error}</Notice> : null}
      <Field label="Name" error={form.formState.errors.name?.message}><input className={fieldClass} {...form.register("name")} /></Field>
      <Field label="Category slug"><input className={fieldClass} {...form.register("category")} /></Field>
      <Field label="Layout">
        <select className={fieldClass} {...form.register("layoutConfig.layout")}>
          <option value="classic">Classic</option>
          <option value="bold">Bold</option>
          <option value="minimal">Minimal</option>
          <option value="split">Split</option>
          <option value="market">Spice market</option>
          <option value="night">Midnight</option>
          <option value="fresh">Fresh</option>
          <option value="frame">Salon frame</option>
          <option value="ticket">Ticket stub</option>
        </select>
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        {(["backgroundColor", "textColor", "accentColor", "mutedColor"] as const).map((key) => (
          <Field key={key} label={key}><input className={fieldClass} {...form.register(`layoutConfig.${key}`)} /></Field>
        ))}
      </div>
      <Field label="Font">
        <select className={fieldClass} {...form.register("layoutConfig.fontFamily")}><option value="serif">Serif</option><option value="sans">Sans</option></select>
      </Field>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...form.register("layoutConfig.showAddress")} /> Show address</label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...form.register("layoutConfig.showValidity")} /> Show validity</label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...form.register("layoutConfig.showPrices")} /> Show prices</label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...form.register("isActive")} /> Active</label>
      <ImageField label="Background image" value={backgroundUrl || ""} onChange={(url) => form.setValue("backgroundUrl", url)} />
      <ImageField label="Thumbnail" value={thumbnailUrl || ""} onChange={(url) => form.setValue("thumbnailUrl", url)} />
      <Button type="submit">{template ? "Save template" : "Create template"}</Button>
    </form>
  );
}
