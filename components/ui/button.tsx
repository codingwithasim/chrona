import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-xl border-2 border-transparent bg-clip-padding text-sm font-bold whitespace-nowrap transition-all outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-ink bg-primary text-primary-foreground shadow-cel-sm hover:-translate-y-px hover:shadow-cel active:translate-x-0.5 active:translate-y-0.5 active:shadow-none",
        outline:
          "border-ink/70 bg-card text-foreground shadow-cel-sm hover:-translate-y-px hover:bg-muted hover:shadow-cel active:translate-x-0.5 active:translate-y-0.5 active:shadow-none aria-expanded:bg-muted dark:border-border",
        secondary:
          "border-ink/70 bg-secondary text-secondary-foreground shadow-cel-sm hover:-translate-y-px hover:shadow-cel active:translate-x-0.5 active:translate-y-0.5 active:shadow-none aria-expanded:bg-secondary dark:border-border",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-10 gap-2 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-7 gap-1 rounded-lg px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-lg px-3 text-xs",
        lg: "h-12 gap-2 rounded-2xl px-6 text-base [&_svg:not([class*='size-'])]:size-5",
        icon: "size-10",
        "icon-xs":
          "size-7 rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-8 rounded-lg",
        "icon-lg": "size-12 rounded-2xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
