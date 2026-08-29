import { cn } from "./cn";

export type PriceSize = "large" | "small";
export type PriceVariant = "default" | "reduced";

export interface PriceProps {
  amount: number;
  currencySymbol?: string;
  size?: PriceSize;
  variant?: PriceVariant;
  wasAmount?: number;
  reducedLabel?: string;
  className?: string;
}

function splitAmount(amount: number): { integer: string; decimals: string } {
  const cents = Math.round(Math.abs(amount) * 100);
  const sign = amount < 0 ? "-" : "";
  return {
    integer: `${sign}${Math.floor(cents / 100).toLocaleString("en-AU")}`,
    decimals: String(cents % 100).padStart(2, "0"),
  };
}

function sizeClasses(size: PriceSize): string {
  switch (size) {
    case "large":
      return "text-price-l";
    case "small":
      return "text-price-s";
    default: {
      const exhaustive: never = size;
      return exhaustive;
    }
  }
}

function toneClasses(variant: PriceVariant): string {
  switch (variant) {
    case "default":
      return "text-ink";
    case "reduced":
      return "text-price-drop";
    default: {
      const exhaustive: never = variant;
      return exhaustive;
    }
  }
}

export function Price({
  amount,
  currencySymbol = "$",
  size = "large",
  variant = "default",
  wasAmount,
  reducedLabel = "New lower price",
  className,
}: PriceProps) {
  const { integer, decimals } = splitAmount(amount);

  const figure = (
    <span
      className={cn(
        "inline-flex items-start font-bold leading-none tabular-nums",
        sizeClasses(size),
        toneClasses(variant),
      )}
    >
      <span className="relative top-[0.12em] text-[0.5em] leading-none">
        {currencySymbol}
      </span>
      <span>{integer}</span>
      <span className="relative -top-[0.727em] text-[0.5em] leading-none">
        {decimals}
      </span>
    </span>
  );

  if (variant === "default" && wasAmount === undefined) {
    return <span className={className}>{figure}</span>;
  }

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {figure}
      {wasAmount !== undefined ? (
        <span className="text-body-s text-ink-2 tabular-nums">
          {reducedLabel}
          <s className="ml-1">
            {currencySymbol}
            {splitAmount(wasAmount).integer}
          </s>
        </span>
      ) : null}
    </div>
  );
}
