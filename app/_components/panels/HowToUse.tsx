"use client";

import { LARES_TOOLS } from "@/lib/webmcp/tools";
import { Panel } from "../ui";

const EXAMPLE_PROMPTS = [
  "My living room is 4.2m by 3.8m, door on the north wall near the left corner, window along the east wall.",
  "Furnish it for someone who works from home, in warm timber tones. Keep it under $3,000.",
  "Check the clearances and fix anything that fails.",
  "Swap the sofa for something smaller and move the desk under the window.",
];

interface HowToUseProps {
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
 * A judge may open this page cold with no context, so the top of the sidebar
 * has to say what the page is and how to make it work.
 */
export function HowToUse({ available, registeredCount, error }: HowToUseProps) {
  const detected = available === true;
  const toolCount = registeredCount > 0 ? registeredCount : LARES_TOOLS.length;

  return (
    <Panel
      variant="plain"
      title={
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className={`size-2 rounded-pill ${statusDot(available)}`} />
          <h2>{statusLabel(available)}</h2>
        </span>
      }
    >
      <p className="text-body-m text-ink-2">
        Lares is agent-driven. The page publishes its floor plan as {toolCount} WebMCP
        tools, so an agent can measure the room, search a catalog by what physically
        fits, place furniture and read back real clearance violations. You can always
        drag, rotate and delete items yourself on the plan.
      </p>

      {!detected && available !== null ? (
        <div className="bg-surface-sunken rounded-card text-body-m text-ink-2 mt-3 p-3">
          <p className="text-ink font-bold">
            No agent is connected, so nothing will drive the plan for you.
          </p>
          <p className="mt-1">Everything here still works by hand. To enable WebMCP:</p>
          <ul className="mt-2 flex list-disc flex-col gap-1 pl-5">
            <li>
              Open this page in ChatGPT&rsquo;s in-app browser, where it works out of the
              box.
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
        <p className="border-negative rounded-card text-body-m text-negative mt-3 border p-3">
          {error}
        </p>
      ) : null}

      <details className="border-hairline rounded-card mt-3 border p-3">
        <summary className="text-label-m cursor-pointer font-bold">Try saying</summary>
        <ol className="text-body-m text-ink-2 mt-2 flex list-decimal flex-col gap-2 pl-5">
          {EXAMPLE_PROMPTS.map((prompt) => (
            <li key={prompt}>&ldquo;{prompt}&rdquo;</li>
          ))}
        </ol>
      </details>

      <details className="border-hairline rounded-card mt-2 border p-3">
        <summary className="text-label-m cursor-pointer font-bold">
          Editing the plan by hand
        </summary>
        <ul className="text-body-m text-ink-2 mt-2 flex list-disc flex-col gap-1 pl-5">
          <li>Drag any item to move it. It snaps to 10mm, and flush to a nearby wall.</li>
          <li>Arrow keys nudge the selected item; hold Shift for 100mm steps.</li>
          <li>
            Press <Key>R</Key> to rotate, <Key>Delete</Key> to remove, <Key>Esc</Key> to
            deselect.
          </li>
        </ul>
      </details>
    </Panel>
  );
}

function Key({ children }: { children: string }) {
  return (
    <kbd className="bg-surface-sunken rounded-input text-body-s px-1.5 py-0.5 font-bold">
      {children}
    </kbd>
  );
}
