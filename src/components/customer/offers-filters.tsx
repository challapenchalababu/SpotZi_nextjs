"use client";

import { useState } from "react";
import { Filter, X } from "lucide-react";
import { buttonClass, fieldClass } from "@/components/ui/primitives";
import { OFFER_TYPES } from "@/types/domain";

type CategoryOption = { id: string; slug: string; name: string };

type FilterValues = {
  q?: string;
  category?: string;
  city?: string;
  offerType?: string;
  discountMin?: string;
  sort: string;
  currentlyAvailable?: string;
};

export function OffersFilters({
  categories,
  values,
}: {
  categories: CategoryOption[];
  values: FilterValues;
}) {
  const hasActive =
    Boolean(values.q) ||
    Boolean(values.category) ||
    Boolean(values.city) ||
    Boolean(values.offerType) ||
    Boolean(values.discountMin) ||
    values.sort !== "newest" ||
    values.currentlyAvailable === "true";
  const [open, setOpen] = useState(hasActive);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="display text-4xl">Offers</h1>
        <button
          type="button"
          className={buttonClass(open ? "primary" : "secondary")}
          aria-expanded={open}
          aria-controls="offers-filter-panel"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="size-4" aria-hidden="true" /> : <Filter className="size-4" aria-hidden="true" />}
          {open ? "Hide filters" : "Filters"}
          {hasActive && !open ? (
            <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">On</span>
          ) : null}
        </button>
      </div>

      {open ? (
        <form id="offers-filter-panel" className="grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-4" action="/offers">
          <input className={fieldClass} name="q" defaultValue={values.q} placeholder="Business or offer" aria-label="Search" />
          <select className={fieldClass} name="category" defaultValue={values.category || ""} aria-label="Category">
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
          <input className={fieldClass} name="city" defaultValue={values.city} placeholder="City" aria-label="City" />
          <select className={fieldClass} name="offerType" defaultValue={values.offerType || ""} aria-label="Offer type">
            <option value="">All types</option>
            {OFFER_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <input
            className={fieldClass}
            name="discountMin"
            defaultValue={values.discountMin}
            placeholder="Minimum discount %"
            aria-label="Minimum discount"
          />
          <select className={fieldClass} name="sort" defaultValue={values.sort} aria-label="Sort">
            <option value="newest">Newest</option>
            <option value="discount">Discount</option>
            <option value="ending">Ending soon</option>
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="currentlyAvailable" value="true" defaultChecked={values.currentlyAvailable === "true"} />
            Open now
          </label>
          <button className="w-full rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground md:w-auto" type="submit">
            Apply filters
          </button>
        </form>
      ) : null}
    </div>
  );
}
