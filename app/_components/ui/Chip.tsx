import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

export interface ChipProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  selected?: boolean;
  count?: number;
  children: ReactNode;
}

export function Chip({
  selected = false,
  count,
  type = "button",
  className,
  children,
  ...rest
}: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={cn(
        "inline-flex min-h-10 items-center gap-1.5 rounded-pill px-4 text-label-m font-bold text-ink transition-shadow",
        selected
          ? "bg-surface-sunken shadow-ring-ink-thick"
          : "bg-surface shadow-ring-hairline hover:shadow-ring-ink",
        "disabled:pointer-events-none disabled:text-ink-3 disabled:shadow-ring-hairline",
        className,
      )}
      {...rest}
    >
      {children}
      {count !== undefined ? (
        <span className="ml-1 rounded-full bg-ink px-1.5 text-label-xs font-bold text-ink-inverse tabular-nums">
          {count}
        </span>
      ) : null}
    </button>
  );
}
