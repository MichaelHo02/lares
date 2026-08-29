"use client";

import { useEffect, useRef, useState } from "react";
import { getModelContext, type ToolDescriptor } from "./types";

/**
 * Chrome documents an experimental `usewebmcp` package for React. This is a
 * local equivalent so the project depends only on the browser API itself, which
 * is the thing the standard actually guarantees.
 *
 * Registration is scoped to the component lifecycle: the effect passes an
 * `AbortController` signal to `registerTool` and aborts on unmount, so tools
 * never outlive the component that owns their state.
 */
export function useWebMCPTools(tools: readonly ToolDescriptor[]): {
  available: boolean;
  registered: readonly string[];
  error: string | null;
} {
  const [available, setAvailable] = useState(false);
  const [registered, setRegistered] = useState<readonly string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Tool descriptors close over store accessors rather than React state, so a
  // ref keeps the registration effect from re-running on every render.
  const latest = useRef(tools);
  latest.current = tools;

  useEffect(() => {
    const modelContext = getModelContext();
    if (!modelContext) {
      setAvailable(false);
      return;
    }
    setAvailable(true);

    const controller = new AbortController();
    let cancelled = false;

    const register = async () => {
      const names: string[] = [];
      for (const tool of latest.current) {
        if (controller.signal.aborted) return;
        try {
          await modelContext.registerTool(tool, { signal: controller.signal });
          names.push(tool.name);
        } catch (cause) {
          if (cancelled) return;
          setError(
            `Failed to register "${tool.name}": ${
              cause instanceof Error ? cause.message : String(cause)
            }`,
          );
        }
      }
      if (!cancelled) setRegistered(names);
    };

    void register();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  return { available, registered, error };
}

/** Feature detection for rendering the setup guidance, updated after hydration. */
export function useWebMCPAvailability(): boolean | null {
  const [available, setAvailable] = useState<boolean | null>(null);
  useEffect(() => {
    setAvailable(getModelContext() !== null);
  }, []);
  return available;
}
