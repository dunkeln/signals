"use client";

import * as React from "react";
import { track } from "@vercel/analytics";

export function HomeVideoFeature() {
  const [isPlaying, setIsPlaying] = React.useState(false);

  return (
    <section
      aria-label="Signals video"
      className="mb-12 max-w-4xl"
    >
      <div className="border border-foreground bg-foreground p-1">
        <div className="aspect-video bg-black">
          {isPlaying ? (
            <iframe
              className="size-full"
              src="https://www.youtube-nocookie.com/embed/GPd2CR9QvK8?autoplay=1&rel=0&modestbranding=1&playsinline=1"
              title="Signals workflow video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          ) : (
            <button
              type="button"
              aria-label="Play Signals workflow video"
              onClick={() => {
                track("Video Play", { video: "homepage" });
                setIsPlaying(true);
              }}
              className="group flex size-full items-center justify-center bg-background text-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              <span className="flex size-20 items-center justify-center bg-foreground text-background transition-transform group-hover:scale-105">
                <span className="ml-1 h-0 w-0 border-y-[14px] border-l-[22px] border-y-transparent border-l-current" />
              </span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
