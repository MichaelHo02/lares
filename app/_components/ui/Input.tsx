import type { InputHTMLAttributes } from "react";
import { cn } from "./cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  suffix?: string;
  hint?: string;
  error?: string;
  wrapperClassName?: string;
}

export function Input({
  label,
  suffix,
  hint,
  error,
  wrapperClassName,
  className,
  disabled,
  ...rest
}: InputProps) {
  const ring = error
    ? "shadow-ring-negative"
    : "shadow-ring-subtle focus-within:shadow-ring-ink-thick";

  return (
    <label className={cn("flex flex-col gap-1.5", wrapperClassName)}>
      {label ? (
        <span className="text-label-m font-bold text-ink">{label}</span>
      ) : null}
      <div
        className={cn(
          "flex w-full items-center rounded-input bg-surface px-1.5 transition-shadow",
          ring,
          disabled && "bg-surface-sunken shadow-ring-disabled",
        )}
      >
        <input
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          className={cn(
            "min-h-14 w-full bg-transparent px-2 text-body-l text-ink tabular-nums",
            "placeholder:text-ink-3 focus:outline-none disabled:text-ink-3",
            className,
          )}
          {...rest}
        />
        {suffix ? (
          <span className="pr-2 text-body-m text-ink-3">{suffix}</span>
        ) : null}
      </div>
      {error ? (
        <span className="text-body-s text-negative">{error}</span>
      ) : hint ? (
        <span className="text-body-s text-ink-2">{hint}</span>
      ) : null}
    </label>
  );
}
