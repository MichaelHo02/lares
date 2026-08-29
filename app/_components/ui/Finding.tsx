import type { ReactNode } from "react";
import { cn } from "./cn";

export type FindingSeverity = "error" | "warning" | "info" | "pass";

export interface FindingProps {
  severity: FindingSeverity;
  title: string;
  detail?: string;
  action?: ReactNode;
  className?: string;
}

interface SeverityStyle {
  container: string;
  icon: string;
  path: string;
  label: string;
}

function severityStyle(severity: FindingSeverity): SeverityStyle {
  switch (severity) {
    case "error":
      return {
        container: "border-negative bg-tint-negative",
        icon: "text-negative",
        path: "M12 8v5m0 3.5h.01M12 3.5 2.5 20h19L12 3.5Z",
        label: "Error",
      };
    case "warning":
      return {
        container: "border-clearance-stroke bg-tint-caution",
        icon: "text-caution-text",
        path: "M12 8v5m0 3.5h.01M12 3.5 2.5 20h19L12 3.5Z",
        label: "Warning",
      };
    case "info":
      return {
        container: "border-informative bg-tint-informative",
        icon: "text-informative",
        path: "M12 11v5m0-8.5h.01M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z",
        label: "Information",
      };
    case "pass":
      return {
        container: "border-positive bg-tint-positive",
        icon: "text-positive",
        path: "m8 12.5 2.75 2.75L16.5 9.5M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z",
        label: "Pass",
      };
    default: {
      const exhaustive: never = severity;
      return exhaustive;
    }
  }
}

export function Finding({
  severity,
  title,
  detail,
  action,
  className,
}: FindingProps) {
  const style = severityStyle(severity);

  return (
    <li
      className={cn(
        "flex gap-3 border-l-4 px-4 py-3",
        style.container,
        className,
      )}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        role="img"
        aria-label={style.label}
        className={cn("mt-0.5 size-5 shrink-0", style.icon)}
      >
        <path d={style.path} />
      </svg>
      <div className="flex flex-col gap-0.5">
        <p className="text-label-m font-bold text-ink">{title}</p>
        {detail ? (
          <p className="text-body-m text-ink-2 tabular-nums">{detail}</p>
        ) : null}
        {action ? <div className="mt-1 self-start">{action}</div> : null}
      </div>
    </li>
  );
}

export interface FindingListProps {
  children: ReactNode;
  className?: string;
}

export function FindingList({ children, className }: FindingListProps) {
  return (
    <ul className={cn("divide-y divide-hairline", className)}>{children}</ul>
  );
}
