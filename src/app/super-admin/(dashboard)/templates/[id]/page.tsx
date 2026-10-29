import { notFound } from "next/navigation";
import { TemplateForm } from "@/components/forms/catalog-forms";
import { getTemplate } from "@/services/catalog.service";

export const metadata = { title: "Edit template" };

export default async function EditTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const template = await getTemplate((await params).id, true).catch(() => null);
  if (!template) notFound();
  return (
    <div className="space-y-4">
      <h1 className="display text-4xl">Edit {template.name}</h1>
      <TemplateForm template={template} />
    </div>
  );
}
