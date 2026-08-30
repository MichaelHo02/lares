"use client";

import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from "react";
import { LARES_TOOLS } from "@/lib/webmcp/tools";

const FIRST_PROMPT =
  "It's 4.2 by 3.8 metres, door on the north wall near the left, window along the east wall.";

interface EmptyStudioProps {
  available: boolean | null;
  registeredCount: number;
  error: string | null;
  hasRoom?: boolean;
  children: ReactNode;
}

function statusDot(available: boolean | null): string {
  if (available === null) return "bg-neutral-4";
  return available ? "bg-positive" : "bg-caution";
}

function statusLabel(available: boolean | null): string {
  if (available === null) return "Checking for WebMCP…";
  return available ? "WebMCP connected" : "WebMCP not detected";
}

function withDescribedBy(children: ReactNode, panelId: string): ReactNode {
  if (!isValidElement<{ "aria-describedby"?: string }>(children)) return children;
  return cloneElement(children as ReactElement<{ "aria-describedby"?: string }>, {
    "aria-describedby": panelId,
  });
}

/**
 * How-to copy for WebMCP and the empty studio. Shown only while the status
 * chip is hovered or focused, so the viewport stays fully usable.
 */
export function EmptyStudio({
  available,
  registeredCount,
  error,
  hasRoom = false,
  children,
}: EmptyStudioProps) {
  const panelId = useId();
  const detected = available === true;
  const toolCount = registeredCount > 0 ? registeredCount : LARES_TOOLS.length;

  return (
    <div className="group relative">
      {withDescribedBy(children, panelId)}
      <div
        id={panelId}
        role="tooltip"
        className="pointer-events-none invisible absolute top-full right-0 left-auto z-30 w-[min(28rem,calc(100vw-2rem))] pt-2 opacity-0 transition-opacity duration-150 group-hover:pointer-events-auto group-hover:visible group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:visible group-focus-within:opacity-100"
      >
        <div className="rounded-sheet border border-hairline bg-surface/95 p-5 shadow-sheet backdrop-blur-sm">
          <p className="flex items-center gap-2 text-caption-m text-ink-3">
            <span aria-hidden className={`size-2 rounded-pill ${statusDot(available)}`} />
            {statusLabel(available)}
          </p>
          <p className="text-heading-s mt-3 font-bold text-ink">
            {hasRoom ? "Keep shaping the room" : "Describe your room"}
          </p>
          <p className="text-body-m mt-2 text-ink-2">
            {hasRoom
              ? `Tell the agent the size, or change the name and measurements up here. Furnish through ${toolCount} tools — you and the agent share the same studio.`
              : `The studio starts empty — no walls, no furniture, no assumed layout. Set the size here, or tell the agent, and the space appears. After that, furnish through ${toolCount} tools.`}
          </p>
          <blockquote className="border-hairline bg-surface-sunken text-body-m text-ink mt-4 rounded-card border-l-4 border-l-ink px-3 py-3">
            &ldquo;{FIRST_PROMPT}&rdquo;
          </blockquote>

          {!detected && available !== null ? (
            <div className="bg-surface-sunken rounded-card text-body-m text-ink-2 mt-4 p-3">
              <p className="text-ink font-bold">
                No agent is connected. You can still draw the room and shop from
                here; an agent is only needed if you want to describe it in
                conversation.
              </p>
              <p className="mt-1">To enable WebMCP:</p>
              <ul className="mt-2 flex list-disc flex-col gap-1 pl-5">
                <li>
                  Open this page in ChatGPT&rsquo;s in-app browser, where it works out of
                  the box.
                </li>
                <li>
                  Or use Chrome 149+, set{" "}
                  <code className="bg-surface rounded-input text-body-s px-1 py-0.5">
                    chrome://flags/#enable-webmcp-testing
                  </code>{" "}
                  to Enabled, and relaunch.
                </li>
              </ul>
            </div>
          ) : null}

          {error ? (
            <p className="border-negative rounded-card text-body-m text-negative mt-4 border p-3">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
