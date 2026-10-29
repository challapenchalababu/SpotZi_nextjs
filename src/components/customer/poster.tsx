import { formatAddress, formatDate, formatMoney } from "@/lib/format";
import type { LayoutConfig } from "@/types/domain";

export function OfferPoster({
  title,
  businessName,
  discountLabel,
  validUntil,
  address,
  originalPrice,
  discountedPrice,
  layout,
  backgroundUrl,
  className = "",
}: {
  title: string;
  businessName: string;
  discountLabel: string;
  validUntil?: string;
  address?: string;
  originalPrice?: number;
  discountedPrice?: number;
  layout?: LayoutConfig;
  backgroundUrl?: string;
  className?: string;
}) {
  const config: LayoutConfig = layout ?? {
    layout: "classic",
    backgroundColor: "#143f3b",
    textColor: "#f7f3ea",
    accentColor: "#e25b2a",
    mutedColor: "#d7efe9",
    fontFamily: "serif",
    logoPosition: "top-left",
    showAddress: true,
    showValidity: true,
    showPrices: true,
  };
  const font = config.fontFamily === "serif" ? "font-display" : "font-sans";
  const align = config.logoPosition === "top-center" ? "text-center" : config.logoPosition === "top-right" ? "text-right" : "text-left";
  const prices = config.showPrices && (originalPrice != null || discountedPrice != null) ? (
    <p className="text-sm" style={{ color: config.mutedColor }}>
      {originalPrice != null ? <span className="mr-2 line-through">{formatMoney(originalPrice)}</span> : null}
      {discountedPrice != null ? <span style={{ color: config.textColor }}>{formatMoney(discountedPrice)}</span> : null}
    </p>
  ) : null;
  const meta = (
    <div className="text-xs" style={{ color: config.mutedColor }}>
      {config.showValidity && validUntil ? <p>Until {formatDate(validUntil)}</p> : null}
      {config.showAddress && address ? <p>{address}</p> : null}
    </div>
  );
  const shell = `relative flex h-full min-h-52 overflow-hidden ${font} ${className}`;
  const style = {
    backgroundColor: config.backgroundColor,
    color: config.textColor,
    backgroundImage: backgroundUrl ? `linear-gradient(180deg, rgba(0,0,0,.25), rgba(0,0,0,.45)), url(${backgroundUrl})` : undefined,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };

  if (config.layout === "market") {
    return (
      <div className={`${shell} flex-col`} style={style}>
        <div className={`flex flex-1 flex-col p-4 ${align}`}>
          <p className="text-xs uppercase tracking-[0.22em]">{businessName}</p>
          <h3 className="mt-3 text-2xl leading-tight">{title}</h3>
          <div className="mt-auto pt-4">{meta}</div>
        </div>
        <div className="px-4 py-3" style={{ background: config.accentColor, color: config.backgroundColor }}>
          <p className="text-3xl font-semibold leading-none">{discountLabel}</p>
          {config.showPrices && (originalPrice != null || discountedPrice != null) ? (
            <p className="mt-1 text-sm">
              {originalPrice != null ? <span className="mr-2 line-through opacity-70">{formatMoney(originalPrice)}</span> : null}
              {discountedPrice != null ? <span>{formatMoney(discountedPrice)}</span> : null}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  if (config.layout === "night") {
    return (
      <div className={`${shell} flex-col items-center justify-center px-6 py-8 text-center`} style={style}>
        <span className="mb-4 h-px w-16" style={{ background: config.accentColor }} />
        <p className="text-xs uppercase tracking-[0.28em]" style={{ color: config.accentColor }}>{businessName}</p>
        <p className="mt-3 text-5xl font-semibold leading-none">{discountLabel}</p>
        <h3 className="mt-3 max-w-xs text-xl leading-tight">{title}</h3>
        {prices ? <div className="mt-3">{prices}</div> : null}
        <div className="mt-4">{meta}</div>
      </div>
    );
  }

  if (config.layout === "fresh") {
    return (
      <div className={`${shell}`} style={style}>
        <div className="flex w-[38%] shrink-0 flex-col items-center justify-center px-3 text-center" style={{ background: config.accentColor, color: config.backgroundColor }}>
          <p className="text-3xl font-semibold leading-none">{discountLabel}</p>
        </div>
        <div className="flex min-w-0 flex-1 flex-col p-4">
          <p className="text-xs uppercase tracking-[0.18em]">{businessName}</p>
          <h3 className="mt-3 text-xl leading-tight">{title}</h3>
          {prices ? <div className="mt-3">{prices}</div> : null}
          <div className="mt-auto pt-4">{meta}</div>
        </div>
      </div>
    );
  }

  if (config.layout === "frame") {
    return (
      <div className={`${shell} p-3`} style={style}>
        <div className="flex h-full w-full flex-col items-center justify-center border-2 px-4 py-6 text-center" style={{ borderColor: config.accentColor }}>
          <p className="text-xs uppercase tracking-[0.24em]" style={{ color: config.accentColor }}>{businessName}</p>
          <p className="mt-3 text-4xl font-semibold leading-none">{discountLabel}</p>
          <h3 className="mt-3 text-xl leading-tight">{title}</h3>
          {prices ? <div className="mt-3">{prices}</div> : null}
          <div className="mt-4">{meta}</div>
        </div>
      </div>
    );
  }

  if (config.layout === "ticket") {
    return (
      <div className={`${shell} items-stretch p-3`} style={style}>
        <div className="flex w-28 shrink-0 items-center justify-center overflow-hidden border-r-2 border-dashed px-2 text-center" style={{ borderColor: config.accentColor, color: config.accentColor }}>
          <p className="text-lg font-semibold leading-tight">{discountLabel}</p>
        </div>
        <div className="flex min-w-0 flex-1 flex-col px-4 py-3">
          <p className="text-xs uppercase tracking-[0.2em]">{businessName}</p>
          <h3 className="mt-2 text-xl leading-tight">{title}</h3>
          {prices ? <div className="mt-3">{prices}</div> : null}
          <div className="mt-auto pt-3">{meta}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${shell} flex-col p-4 ${align}`} style={style}>
      {config.layout === "split" ? <span className="absolute inset-y-0 left-0 w-2" style={{ background: config.accentColor }} /> : null}
      {config.layout === "bold" ? <span className="absolute right-0 top-0 h-16 w-16" style={{ background: config.accentColor }} /> : null}
      <p className="text-xs uppercase tracking-[0.2em]">{businessName}</p>
      <p className={`mt-3 font-semibold leading-none ${config.layout === "bold" ? "text-5xl" : "text-3xl"}`} style={{ color: config.accentColor }}>{discountLabel}</p>
      <h3 className="mt-3 text-xl leading-tight">{title}</h3>
      {prices ? <div className="mt-3">{prices}</div> : null}
      <div className="mt-auto pt-4">{meta}</div>
    </div>
  );
}

export function formatPosterAddress(address?: { area?: string; city?: string; line1?: string }) {
  if (!address) return undefined;
  return formatAddress({
    line1: address.line1 || "",
    area: address.area || "",
    city: address.city || "",
    citySlug: "",
    pincode: "",
    country: "",
  });
}
