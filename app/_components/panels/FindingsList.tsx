"use client";

import { useCallback } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import {
  FINDING_CODE_TITLES,
  summariseFindings,
  type Finding as ClearanceFinding,
  type Severity,
} from "@/lib/clearance/findings";
import { selectPlacement } from "@/lib/store/operations";
import { Button, Finding, FindingList, Panel } from "../ui";
import type { FindingSeverity } from "../ui";
import { findingKey } from "../plan/ViolationOverlay";

interface FindingsListProps {
  findings: readonly ClearanceFinding[];
  onHighlight: (key: string | null) => void;
  embedded?: boolean;
}

function toSeverity(severity: Severity): FindingSeverity {
  switch (severity) {
    case "error":
      return "error";
    case "warning":
      return "warning";
    default: {
      const exhaustive: never = severity;
      throw new Error(`unhandled severity: ${String(exhaustive)}`);
    }
  }
}

function detailOf(finding: ClearanceFinding): string {
  if (finding.measuredMm === null || finding.requiredMm === null) return finding.message;
  return `${finding.message} (${finding.measuredMm}mm of ${finding.requiredMm}mm)`;
}

export function FindingsList({ findings, onHighlight, embedded = false }: FindingsListProps) {
  const summary = summariseFindings(findings);

  // Delegated so hovering a row can highlight its zone on the plan without the
  // shared Finding primitive needing to know about pointer handlers.
  const handleHover = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const row = target.closest("li");
      const list = row?.parentElement;
      if (!row || !list) {
        onHighlight(null);
        return;
      }
      const index = Array.prototype.indexOf.call(list.children, row);
      const finding = findings[index];
      onHighlight(finding ? findingKey(finding, index) : null);
    },
    [findings, onHighlight],
  );

  const status = summary.passes
    ? "All clear"
    : `${summary.errors} to fix · ${summary.warnings} to consider`;

  const body =
    findings.length === 0 ? (
      <p className={`text-body-s text-ink-3 ${embedded ? "mt-2" : "text-body-m text-ink-2 p-4"}`}>
        Nothing placed yet, or nothing wrong with what is. Violations appear here and
        are annotated on the plan against the gap they affect.
      </p>
    ) : (
      <div onMouseOver={handleHover} onMouseLeave={() => onHighlight(null)}>
        <FindingList>
          {findings.map((finding, index) => {
            const first = finding.placementIds[0];
            return (
              <Finding
                key={findingKey(finding, index)}
                severity={toSeverity(finding.severity)}
                title={FINDING_CODE_TITLES[finding.code]}
                detail={detailOf(finding)}
                action={
                  first ? (
                    <Button
                      variant="tertiary"
                      size="small"
                      onClick={() => selectPlacement(first)}
                      onFocus={() => onHighlight(findingKey(finding, index))}
                      onBlur={() => onHighlight(null)}
                    >
                      Show
                    </Button>
                  ) : undefined
                }
              />
            );
          })}
        </FindingList>
      </div>
    );

  if (embedded) {
    return (
      <section className="border-t border-hairline pt-3">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-label-s font-bold uppercase tracking-wide text-ink-3">
            Clearances
          </h2>
          <span className="text-body-s tabular-nums text-ink-3">{status}</span>
        </div>
        {body}
      </section>
    );
  }

  return (
    <Panel
      variant="plain"
      title="Clearances"
      actions={<span className="text-body-m text-ink-2 tabular-nums">{status}</span>}
      bodyClassName="p-0"
    >
      {body}
    </Panel>
  );
}
