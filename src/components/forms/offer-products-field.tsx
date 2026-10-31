"use client";

import { useEffect, useState } from "react";
import { ImageField } from "@/components/forms/image-field";
import { Button, Field, fieldClass } from "@/components/ui/primitives";
import type { OfferProductInput } from "@/types/domain";

type Draft = {
  name: string;
  discountValue: number | "";
  originalPrice: number | "";
  discountedPrice: number | "";
  posterUrl: string;
};

function blankRow(): Draft {
  return { name: "", discountValue: "", originalPrice: "", discountedPrice: "", posterUrl: "" };
}

type ProductValue = Partial<OfferProductInput> & { name?: string };

function fromValue(products?: ProductValue[] | null): Draft[] {
  if (!products?.length) return [blankRow()];
  return products.map((product) => ({
    name: product.name || "",
    discountValue: product.discountValue ?? "",
    originalPrice: product.originalPrice ?? "",
    discountedPrice: product.discountedPrice ?? "",
    posterUrl: product.posterUrl || "",
  }));
}

function toValue(products: Draft[]): OfferProductInput[] {
  return products.map((product) => ({
    name: product.name.trim(),
    discountValue: product.discountValue === "" ? undefined : Number(product.discountValue),
    originalPrice: product.originalPrice === "" ? undefined : Number(product.originalPrice),
    discountedPrice: product.discountedPrice === "" ? undefined : Number(product.discountedPrice),
    posterUrl: product.posterUrl || "",
  }));
}

export function OfferProductsField({
  value,
  onChange,
  offerType,
}: {
  value?: ProductValue[] | null;
  onChange: (products: OfferProductInput[]) => void;
  offerType?: string;
}) {
  const [products, setProducts] = useState<Draft[]>(() => fromValue(value));

  useEffect(() => {
    setProducts(fromValue(value));
  }, [value]);

  function sync(next: Draft[]) {
    setProducts(next);
    onChange(toValue(next));
  }

  const discountLabel = offerType === "flat" ? "Discount value (amount)" : offerType === "percentage" ? "Discount value (%)" : "Discount value";

  return (
    <div className="space-y-4 rounded-2xl border border-primary/20 bg-primary/5 p-4">
      <div>
        <p className="text-sm font-medium">Product offers</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Enter one product below for a single offer. Click Add product to create more offers with different prices and posters. They all use the same template. Each saved product gets its own redemption code at the selected branch.
        </p>
      </div>

      {products.map((product, index) => (
        <div key={index} className="space-y-3 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">Product {index + 1}</p>
            {products.length > 1 ? (
              <Button type="button" variant="ghost" onClick={() => sync(products.filter((_, productIndex) => productIndex !== index))}>
                Remove
              </Button>
            ) : null}
          </div>
          <Field label="Product / offer name">
            <input
              className={fieldClass}
              value={product.name}
              placeholder="e.g. Diwali gift hamper"
              onChange={(event) => {
                const next = [...products];
                next[index] = { ...next[index], name: event.target.value };
                sync(next);
              }}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label={discountLabel}>
              <input
                className={fieldClass}
                type="number"
                step="any"
                value={product.discountValue}
                placeholder={offerType === "percentage" ? "50" : "100"}
                onChange={(event) => {
                  const next = [...products];
                  next[index] = { ...next[index], discountValue: event.target.value === "" ? "" : Number(event.target.value) };
                  sync(next);
                }}
              />
            </Field>
            <Field label="Original price">
              <input
                className={fieldClass}
                type="number"
                step="any"
                value={product.originalPrice}
                placeholder="1000"
                onChange={(event) => {
                  const next = [...products];
                  next[index] = { ...next[index], originalPrice: event.target.value === "" ? "" : Number(event.target.value) };
                  sync(next);
                }}
              />
            </Field>
            <Field label="Offer price">
              <input
                className={fieldClass}
                type="number"
                step="any"
                value={product.discountedPrice}
                placeholder="500"
                onChange={(event) => {
                  const next = [...products];
                  next[index] = { ...next[index], discountedPrice: event.target.value === "" ? "" : Number(event.target.value) };
                  sync(next);
                }}
              />
            </Field>
          </div>
          <ImageField
            label="Product poster"
            value={product.posterUrl}
            onChange={(url) => {
              const next = [...products];
              next[index] = { ...next[index], posterUrl: url };
              sync(next);
            }}
          />
        </div>
      ))}

      <Button type="button" variant="secondary" onClick={() => sync([...products, blankRow()])}>
        Add product
      </Button>
    </div>
  );
}
