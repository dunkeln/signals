"use client";

import * as React from "react";
import Link from "next/link";
import { BracketsIcon, CheckIcon, PlusIcon } from "lucide-react";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { fixtureRoutes } from "@/lib/fixtures/registry";

const routeEntries = fixtureRoutes.map((fixture) => ({
  href: `/${fixture.slug}`,
  label: fixture.label,
  slug: fixture.slug,
}));

export function SiteBreadcrumb() {
  const pathname = usePathname();
  const clientSegment = pathname === "/" ? null : pathname.split("/")[1];
  const clientSlug = clientSegment ? decodeURIComponent(clientSegment) : null;
  const activeRoute = routeEntries.find((route) => route.slug === clientSlug);
  const fallbackClientName = activeRoute?.label ?? clientSlug;
  const documentTitle = React.useSyncExternalStore(
    (onStoreChange) => {
      function handleTitleChange(event: Event) {
        const detail = (event as CustomEvent<{ clientSlug?: string }>).detail;

        if (!clientSlug || detail?.clientSlug === clientSlug) {
          onStoreChange();
        }
      }

      window.addEventListener("signal-document-title-change", handleTitleChange);

      return () => {
        window.removeEventListener("signal-document-title-change", handleTitleChange);
      };
    },
    () =>
      clientSlug
        ? window.localStorage.getItem(`signal:document-title:${clientSlug}`)
        : null,
    () => null,
  );
  const clientName = documentTitle ?? fallbackClientName;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink
            render={<Link href="/" className="flex items-center gap-2" />}
          >
            <BracketsIcon />
            <span className="text-sm font-medium tracking-normal">Signals</span>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  size={clientName ? "sm" : "icon-sm"}
                  variant="ghost"
                  aria-label="Open fixture routes"
                />
              }
            >
              {clientName ? (
                <span className="truncate">{clientName}</span>
              ) : (
                <BreadcrumbEllipsis />
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" sideOffset={8} className="w-44">
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <PlusIcon data-icon="inline-start" />
                  Add client
                </DropdownMenuItem>
                {routeEntries.map((route) => {
                  const isActive = route.slug === clientSlug;

                  return (
                  <DropdownMenuItem
                    key={route.slug}
                    render={<Link href={route.href} />}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <span className="truncate">{route.label}</span>
                    {isActive ? <CheckIcon className="ml-auto" /> : null}
                  </DropdownMenuItem>
                  );
                })}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
