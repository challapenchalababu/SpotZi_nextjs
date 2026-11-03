"use client";

import Image from "next/image";
import { useState } from "react";
import { DirectionsLink } from "@/components/customer/directions-link";
import { Dialog } from "@/components/ui/primitives";
import { formatAddress } from "@/lib/format";
import type { PublicBranchRef, PublicBusinessRef } from "@/types/domain";

export function ShopDetailsButton({
  business,
  branch,
}: {
  business: PublicBusinessRef;
  branch: PublicBranchRef;
}) {
  const [open, setOpen] = useState(false);
  const photoUrl = branch.photoUrl || business.logoUrl;
  const address = formatAddress(branch.address);

  return (
    <>
      <button type="button" className="text-sm font-semibold text-primary" onClick={() => setOpen(true)}>
        Show shop details
      </button>
      <Dialog open={open} title="Shop details" onClose={() => setOpen(false)}>
        <div className="space-y-4">
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted">
            {photoUrl ? (
              <Image
                src={photoUrl}
                alt={`${business.businessName} ${branch.branchName}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 28rem"
              />
            ) : (
              <div className="flex h-full min-h-40 items-center justify-center bg-primary/10 p-6 text-center">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-primary">{business.businessName}</p>
                  <p className="mt-2 text-xl font-semibold text-foreground">{branch.branchName}</p>
                </div>
              </div>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-lg font-semibold">{business.businessName}</p>
            <p className="text-sm font-medium">{branch.branchName}</p>
            {address ? <p className="text-sm text-muted-foreground">{address}</p> : null}
          </div>
          <DirectionsLink latitude={branch.latitude} longitude={branch.longitude} />
        </div>
      </Dialog>
    </>
  );
}
