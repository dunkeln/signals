"use client";

import * as React from "react";
import { XIcon } from "lucide-react";

export function SiteAnnouncementBanner() {
  const [open, setOpen] = React.useState(true);

  if (!open) return null;

  return (
    <div
      data-site-announcement
      className="relative z-20 flex h-7 shrink-0 items-center justify-center bg-black px-8 text-xs font-normal text-white"
    >
      <span className="italic">This is a PoC using simulated procurement cases.</span>
      <button
        type="button"
        aria-label="Close announcement"
        onClick={() => setOpen(false)}
        className="absolute right-3 top-1/2 inline-flex size-5 -translate-y-1/2 items-center justify-center text-white/80 outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-white/40 [&_svg]:size-3.5"
      >
        <XIcon />
      </button>
    </div>
  );
}
