"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

import { cn } from "@/lib/utils"

// Mizan's toasts: a solid white card with the site's border, shadow and type, the icon
// coloured by kind. The colours are written out because sonner reads them as CSS
// variables (shadcn's --popover/--border aren't defined here, so toasts came out see-through),
// and the theme is fixed to light: the site has no dark mode.
const Toaster = ({ toastOptions, ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-[18px]" />,
        info: <InfoIcon className="size-[18px]" />,
        warning: <TriangleAlertIcon className="size-[18px]" />,
        error: <OctagonXIcon className="size-[18px]" />,
        loading: <Loader2Icon className="size-[18px] animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "#ffffff",
          "--normal-text": "#0f2a20",
          "--normal-border": "#e3e8e2",
          "--border-radius": "14px",
        } as React.CSSProperties
      }
      {...props}
      toastOptions={{
        ...toastOptions,
        classNames: {
          ...toastOptions?.classNames,
          // "!": sonner styles toasts through [data-sonner-toast][data-styled] selectors,
          // which outrank a plain class.
          toast: cn(
            "cn-toast gap-3! px-4! py-3.5! text-sm! font-semibold! shadow-[0_16px_32px_-16px_rgb(0_0_0/0.35)]!",
            toastOptions?.classNames?.toast,
          ),
          description: cn("text-muted! text-xs! font-normal!", toastOptions?.classNames?.description),
          success: cn("[&_[data-icon]]:text-brand", toastOptions?.classNames?.success),
          error: cn("[&_[data-icon]]:text-danger", toastOptions?.classNames?.error),
          warning: cn("[&_[data-icon]]:text-amber-600", toastOptions?.classNames?.warning),
          info: cn("[&_[data-icon]]:text-info", toastOptions?.classNames?.info),
          loading: cn("[&_[data-icon]]:text-muted", toastOptions?.classNames?.loading),
        },
      }}
    />
  )
}

export { Toaster }
