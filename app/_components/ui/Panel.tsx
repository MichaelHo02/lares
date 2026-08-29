import type { ReactNode } from "react";
import { cn } from "./cn";

export type PanelVariant = "docked" | "sheet" | "sunken" | "plain";

export interface PanelProps {
  title?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  variant?: PanelVariant;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

function variantClasses(variant: PanelVariant): string {
  switch (variant) {
    case "docked":
      return "h-full w-full border-l border-hairline bg-surface";
    case "sheet":
      return "rounded-sheet bg-surface shadow-[0_4px_16px_#0000001a]";
    case "sunken":
      return "rounded-card bg-surface-sunken";
    case "plain":
      return "rounded-card bg-surface shadow-[inset_0_0_0_1px_#dfdfdf]";
    default: {
      const exhaustive: never = variant;
      return exhaustive;
    }
  }
}

function bodyPadding(variant: PanelVariant): string {
  switch (variant) {
    case "docked":
      return "px-6 py-6";
    case "sheet":
      return "p-6";
    case "sunken":
      return "p-4";
    case "plain":
      return "p-4";
    default: {
      const exhaustive: never = variant;
      return exhaustive;
    }
  }
}

export function Panel({
  title,
  actions,
  footer,
  variant = "docked",
  children,
  className,
  bodyClassName,
}: PanelProps) {
  return (
    <section className={cn("flex flex-col", variantClasses(variant), className)}>
      {title || actions ? (
        <header
          className={cn(
            "flex items-center justify-between gap-4 border-b border-hairline text-heading-l font-bold text-ink",
            variant === "docked" ? "px-6 py-5" : "px-4 py-3",
          )}
        >
          {typeof title === "string" ? <h2>{title}</h2> : title}
          {actions ? (
            <div className="flex items-center gap-2">{actions}</div>
          ) : null}
        </header>
      ) : null}

      <div
        className={cn(
          "flex-1",
          variant === "docked" && "overflow-y-auto",
          bodyPadding(variant),
          bodyClassName,
        )}
      >
        {children}
      </div>

      {footer ? (
        <footer className="border-t border-hairline px-6 py-4">{footer}</footer>
      ) : null}
    </section>
  );
}
