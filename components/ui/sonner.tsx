"use client";

import type * as React from "react";
import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      position="top-right"
      theme="light"
      gap={8}
      offset={18}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--width": "23rem",
          "--normal-bg": "var(--card)",
          "--normal-text": "var(--card-foreground)",
          "--normal-border": "var(--border)",
          "--success-bg": "var(--card)",
          "--success-text": "var(--card-foreground)",
          "--success-border": "var(--border)",
          "--info-bg": "var(--card)",
          "--info-text": "var(--card-foreground)",
          "--info-border": "var(--border)",
          "--warning-bg": "var(--card)",
          "--warning-text": "var(--card-foreground)",
          "--warning-border": "var(--border)",
          "--error-bg": "var(--card)",
          "--error-text": "var(--card-foreground)",
          "--error-border": "var(--border)",
          "--border-radius": "calc(var(--radius) * 1.1)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "min-h-0 items-start gap-3 border-border bg-card px-3.5 py-3 text-card-foreground shadow-md shadow-black/5 data-[type=error]:border-destructive/25 data-[type=success]:border-primary/15 [&_[data-close-button]]:border-border [&_[data-close-button]]:bg-background [&_[data-icon]]:mt-0.5 [&_[data-icon]_svg]:text-muted-foreground data-[type=error]:[&_[data-icon]_svg]:text-destructive data-[type=success]:[&_[data-icon]_svg]:text-primary",
          title: "text-[13px] font-medium leading-5 text-foreground",
          description: "mt-0.5 text-xs leading-5 text-muted-foreground",
          actionButton:
            "bg-primary text-primary-foreground hover:bg-primary/90",
          cancelButton:
            "bg-muted text-foreground hover:bg-muted/80",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
