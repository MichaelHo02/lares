"use client";

import { LARES_TOOLS } from "@/lib/webmcp/tools";

const FIRST_PROMPT =
  "It's 4.2 by 3.8 metres, door on the north wall near the left, window along the east wall.";

interface EmptyStudioProps {
  available: boolean | null;
  registeredCount: number;
  error: string | null;
}

function statusDot(available: boolean | null): string {
  if (available === null) return "bg-neutral-4";
  return available ? "bg-positive" : "bg-caution";
}

function statusLabel(available: boolean | null): string {
  if (available === null) return "Checking for WebMCP…";
  return available ? "WebMCP connected" : "WebMCP not detected";
}

/**
 * Cold start for the studio: no walls, no furniture. The first move is
 * describing the room so the agent calls define_room.
 */
export function EmptyStudio({ available, registeredCount, error }: EmptyStudioProps) {
  const detected = available === true;
  const toolCount = registeredCount > 0 ? registeredCount : LARES_TOOLS.length;

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-6">
      <div className="pointer-events-auto w-[min(28rem,calc(100%-1.5rem))] rounded-sheet border border-hairline bg-surface/95 p-6 shadow-sheet backdrop-blur-sm">
        <p className="flex items-center gap-2 text-caption-m text-ink-3">
          <span aria-hidden className={`size-2 rounded-pill ${statusDot(available)}`} />
          {statusLabel(available)}
        </p>
        <h1 className="text-heading-s mt-3 font-bold text-ink">Describe your room</h1>
        <p className="text-body-m mt-2 text-ink-2">
          The studio starts empty — no walls, no furniture, no assumed layout. Tell
          the agent the size, where the doors and windows are, and the space appears
          here. After that, ask it to furnish through {toolCount} tools.
        </p>
        <blockquote className="border-hairline bg-surface-sunken text-body-m text-ink mt-4 rounded-card border-l-4 border-l-ink px-3 py-3">
          &ldquo;{FIRST_PROMPT}&rdquo;
        </blockquote>

        {!detected && available !== null ? (
          <div className="bg-surface-sunken rounded-card text-body-m text-ink-2 mt-4 p-3">
            <p className="text-ink font-bold">
              No agent is connected, so the room will not appear on its own.
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
  );
}
