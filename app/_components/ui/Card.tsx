import type { ReactNode } from "react";
import { cn } from "./cn";

export type CardBadgeTone = "yellow" | "new" | "offer";

export interface CardProps {
  title: string;
  meta?: string;
  badge?: string;
  badgeTone?: CardBadgeTone;
  media?: ReactNode;
  price?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
}

function badgeClasses(tone: CardBadgeTone): string {
  switch (tone) {
    case "yellow":
      return "bg-accent-yellow text-ink";
    case "new":
      return "bg-surface text-caution-text shadow-ring-ink";
    case "offer":
      return "bg-price-drop text-ink-inverse";
    default: {
      const exhaustive: never = tone;
      return exhaustive;
    }
  }
}

export function Card({
  title,
  meta,
  badge,
  badgeTone = "yellow",
  media,
  price,
  action,
  children,
  className,
}: CardProps) {
  return (
    <article
      className={cn(
        "group relative flex flex-col gap-2 border-b border-r border-hairline bg-surface p-4 pb-6",
        className,
      )}
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-card bg-surface-sunken">
        {media}
        {badge ? (
          <span
            className={cn(
              "absolute left-2 top-2 rounded-badge px-2 py-0.5 text-label-xs font-bold uppercase tracking-wide",
              badgeClasses(badgeTone),
            )}
          >
            {badge}
          </span>
        ) : null}
      </div>

      <h3 className="mt-2 text-heading-s font-bold text-ink">{title}</h3>
      {meta ? <p className="text-body-m text-ink-2">{meta}</p> : null}
      {price ? <div className="mt-1">{price}</div> : null}
      {children}
      {action ? <div className="mt-3">{action}</div> : null}
    </article>
  );
}
