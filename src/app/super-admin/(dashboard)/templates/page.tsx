import Link from "next/link";
import { Badge } from "@/components/ui/primitives";
import { listTemplates } from "@/services/catalog.service";

export const metadata = { title: "Templates" };

export default async function AdminTemplatesPage() {
  const templates = await listTemplates(true);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="display text-4xl">Templates</h1>
        <Link className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" href="/super-admin/templates/new">New template</Link>
      </div>
      <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
        {templates.map((template) => (
          <li key={template.id} className="flex items-center justify-between px-4 py-3">
            <Link href={`/super-admin/templates/${template.id}`}>{template.name}</Link>
            <Badge tone={template.isActive ? "success" : "warning"}>{template.isActive ? "Active" : "Inactive"}</Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}
