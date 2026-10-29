import { TemplateForm } from "@/components/forms/catalog-forms";

export const metadata = { title: "New template" };

export default function NewTemplatePage() {
  return (
    <div className="space-y-4">
      <h1 className="display text-4xl">New template</h1>
      <TemplateForm />
    </div>
  );
}
