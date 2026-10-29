import Link from "next/link";

export function StatGrid({ items }: { items: Array<{ label: string; value: number | string; href?: string }> }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => {
        const card = (
          <>
            <p className="text-sm text-muted-foreground">{item.label}</p>
            <p className="mt-1 text-2xl font-semibold">{item.value}</p>
          </>
        );
        return item.href ? (
          <Link key={item.label} href={item.href} className="rounded-2xl border border-border bg-card p-4 hover:border-primary">{card}</Link>
        ) : (
          <div key={item.label} className="rounded-2xl border border-border bg-card p-4">{card}</div>
        );
      })}
    </div>
  );
}
