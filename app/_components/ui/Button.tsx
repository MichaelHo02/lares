import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

export type ButtonVariant =
  | "primary"
  | "emphasis"
  | "secondary"
  | "tertiary"
  | "destructive";

export type ButtonSize = "medium" | "small";

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  children: ReactNode;
}

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-pill font-bold select-none " +
  "transition-all duration-250 ease-[cubic-bezier(.4,0,.4,1)] " +
  "disabled:pointer-events-none";

function variantClasses(variant: ButtonVariant): string {
  switch (variant) {
    case "primary":
      return "bg-action text-ink-inverse hover:bg-action-hover active:bg-action-pressed disabled:bg-disabled-bg disabled:text-ink-3";
    case "emphasis":
      return "bg-emphasis text-ink-inverse hover:bg-emphasis-hover active:bg-emphasis-pressed disabled:bg-disabled-bg disabled:text-ink-3";
    case "secondary":
      return "bg-transparent text-ink shadow-[inset_0_0_0_1px_#111111] hover:shadow-[inset_0_0_0_2px_#111111] active:bg-neutral-3/50 disabled:shadow-[inset_0_0_0_1px_#cccccc] disabled:text-ink-3";
    case "tertiary":
      return "bg-transparent text-ink hover:bg-subtle-pressed active:bg-neutral-4 disabled:text-ink-3";
    case "destructive":
      return "bg-negative text-ink-inverse hover:bg-negative-hover active:bg-negative-pressed disabled:bg-disabled-bg disabled:text-ink-3";
    default: {
      const exhaustive: never = variant;
      return exhaustive;
    }
  }
}

function sizeClasses(size: ButtonSize): string {
  switch (size) {
    case "medium":
      return "min-h-14 px-8 text-label-l";
    case "small":
      return "min-h-10 px-6 text-label-m";
    default: {
      const exhaustive: never = size;
      return exhaustive;
    }
  }
}

export function Button({
  variant = "primary",
  size = "medium",
  fullWidth = false,
  type = "button",
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        BASE,
        variantClasses(variant),
        sizeClasses(size),
        fullWidth && "w-full",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
