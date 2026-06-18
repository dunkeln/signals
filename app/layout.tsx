import "./globals.css";
import { Geist } from "next/font/google";
import {
  ActivityIcon,
  CompassIcon,
  GaugeIcon,
  SettingsIcon,
} from "lucide-react";

import { SignalPrompt } from "@/components/signal-prompt";
import { SiteBreadcrumb } from "@/components/site-breadcrumb";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const railItems = [
  ActivityIcon,
  CompassIcon,
  GaugeIcon,
  SettingsIcon,
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className="h-svh overflow-hidden">
        <main className="debug-page h-svh overflow-hidden bg-background text-foreground">
          <div className="debug-shell mx-auto flex h-full w-full max-w-5xl flex-col px-5 py-4 sm:px-8">
            <header className="debug-header flex h-12 items-center justify-between">
              <div className="debug-brand flex items-center gap-3">
                <SiteBreadcrumb />
              </div>
            </header>

            <SignalPrompt />

            <div className="debug-layout relative flex flex-1 overflow-hidden pb-24">
              <aside
                aria-label="Section navigation"
                className="debug-rail absolute left-0 top-16 hidden flex-col gap-3 sm:flex"
              >
                {railItems.map((Icon, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Navigation item ${index + 1}`}
                  >
                    <Icon data-icon="inline-start" />
                  </Button>
                ))}
              </aside>

              <section
                aria-label="Workspace"
                className="debug-workspace mx-auto flex min-h-0 w-full flex-1 items-start overflow-y-auto pt-10"
              >
                {children}
              </section>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
