import "./globals.css";
import { Geist } from "next/font/google";

import { SiteBreadcrumb } from "@/components/site-breadcrumb";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className="h-svh overflow-hidden">
        <TooltipProvider>
          <main className="h-svh overflow-hidden bg-background text-foreground">
            <div className="mx-auto flex h-full w-full max-w-5xl flex-col px-5 py-4 sm:px-8">
              <header className="flex h-12 items-center justify-between">
                <div className="flex items-center gap-3">
                  <SiteBreadcrumb />
                </div>
              </header>

              <section
                aria-label="Workspace"
                className="mx-auto flex min-h-0 w-full flex-1 items-start overflow-y-auto pt-10"
              >
                {children}
              </section>
            </div>
          </main>
          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  );
}
