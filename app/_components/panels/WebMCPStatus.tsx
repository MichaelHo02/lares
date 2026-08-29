"use client";

import { LARES_TOOLS, TOOL_GROUPS } from "@/lib/webmcp/tools";

const EXAMPLE_PROMPTS = [
  "My living room is 4.2m by 3.8m, door on the north wall near the left corner, window along the east wall.",
  "Furnish it for someone who works from home. Keep it under $3,000.",
  "Check the clearances and fix anything that fails.",
  "Swap the sofa for something in a warmer timber.",
];

interface WebMCPStatusProps {
  available: boolean | null;
  registered: readonly string[];
  error: string | null;
}

export function WebMCPStatus({ available, registered, error }: WebMCPStatusProps) {
  const detected = available === true;

  return (
    <section aria-labelledby="webmcp-heading" className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className={`h-2 w-2 rounded-full ${
            available === null
              ? "bg-neutral-4"
              : detected
                ? "bg-positive"
                : "bg-caution"
          }`}
        />
        <h2 id="webmcp-heading" className="text-heading-s font-bold">
          {available === null
            ? "Checking for WebMCP…"
            : detected
              ? "WebMCP connected"
              : "WebMCP not detected"}
        </h2>
      </div>

      {detected ? (
        <p className="text-body-s text-ink-2">
          {registered.length > 0 ? registered.length : LARES_TOOLS.length} tools are
          registered on this page. Ask the agent to describe your room and furnish it.
        </p>
      ) : (
        <div className="rounded-card border border-hairline bg-surface-sunken p-3 text-body-s text-ink-2">
          <p>
            This page is agent-driven: it publishes its floor plan as WebMCP tools so an
            agent can measure, place and validate furniture directly. You can still drag
            items around by hand, but there is nothing to talk to yet.
          </p>
          <p className="mt-2">To enable it, open this page in either:</p>
          <ul className="mt-1 list-disc pl-5">
            <li>ChatGPT&rsquo;s in-app browser, where WebMCP works out of the box, or</li>
            <li>
              Chrome 149 or newer, with{" "}
              <code className="font-mono text-ink">
                chrome://flags/#enable-webmcp-testing
              </code>{" "}
              set to Enabled, then relaunch.
            </li>
          </ul>
        </div>
      )}

      {error ? (
        <p className="rounded-card border border-negative p-3 text-body-s text-negative">
          {error}
        </p>
      ) : null}

      <details className="rounded-card border border-hairline p-3">
        <summary className="cursor-pointer text-body-m font-bold">
          Try saying one of these
        </summary>
        <ol className="mt-2 flex list-decimal flex-col gap-1.5 pl-5 text-body-s text-ink-2">
          {EXAMPLE_PROMPTS.map((prompt) => (
            <li key={prompt}>&ldquo;{prompt}&rdquo;</li>
          ))}
        </ol>
      </details>

      <details className="rounded-card border border-hairline p-3">
        <summary className="cursor-pointer text-body-m font-bold">
          The {LARES_TOOLS.length} tools this page publishes
        </summary>
        <div className="mt-2 flex flex-col gap-3">
          {TOOL_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="text-body-s font-bold text-ink-3 uppercase">{group.label}</p>
              <ul className="mt-1 flex flex-col gap-1">
                {group.tools.map((tool) => (
                  <li key={tool.name} className="text-body-s text-ink-2">
                    <code className="font-mono text-ink">{tool.name}</code>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </details>
    </section>
  );
}
