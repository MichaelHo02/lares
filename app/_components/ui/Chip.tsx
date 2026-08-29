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
          ? "bg-surface-sunken shadow-[inset_0_0_0_2px_#111111]"
          : "bg-surface shadow-[inset_0_0_0_1px_#dfdfdf] hover:shadow-[inset_0_0_0_1px_#111111]",
        "disabled:pointer-events-none disabled:text-ink-3 disabled:shadow-[inset_0_0_0_1px_#dfdfdf]",
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
