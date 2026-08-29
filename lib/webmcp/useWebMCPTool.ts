"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { getModelContext, type ToolDescriptor } from "./types";

/**
 * Chrome documents an experimental `usewebmcp` package for React. This is a
 * local equivalent so the project depends only on the browser API itself, which
 * is the part the standard actually guarantees.
 */

/** Capability detection never changes for the life of the document. */
function subscribeToNothing(): () => void {
  return () => {};
}

function readAvailability(): boolean {
  return getModelContext() !== null;
}

/**
 * `null` during server render and hydration, so the UI can say it is still
 * checking rather than briefly claiming WebMCP is missing.
 */
export function useWebMCPAvailability(): boolean | null {
  return useSyncExternalStore<boolean | null>(
    subscribeToNothing,
    readAvailability,
    () => null,
  );
}

export interface WebMCPRegistration {
  available: boolean | null;
  registered: readonly string[];
  error: string | null;
}

/**
 * Registers a fixed set of tools for the lifetime of the calling component.
 * The effect passes an `AbortController` signal to `registerTool` and aborts on
 * unmount, so tools never outlive the component that owns their state.
 */
export function useWebMCPTools(tools: readonly ToolDescriptor[]): WebMCPRegistration {
  const available = useWebMCPAvailability();
  const [registered, setRegistered] = useState<readonly string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Descriptors close over store accessors rather than React state, so the set
  // registered on mount stays correct for the life of the component and is
  // captured once rather than tracked.
  const latest = useRef(tools);

  const register = useCallback(async (signal: AbortSignal) => {
    const modelContext = getModelContext();
    if (!modelContext) return;

    const names: string[] = [];
    for (const tool of latest.current) {
      if (signal.aborted) return;
      try {
        await modelContext.registerTool(tool, { signal });
        names.push(tool.name);
      } catch (cause) {
        if (signal.aborted) return;
        setError(
          `Failed to register "${tool.name}": ${
            cause instanceof Error ? cause.message : String(cause)
          }`,
        );
      }
    }
    if (!signal.aborted) setRegistered(names);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void register(controller.signal);
    return () => controller.abort();
  }, [register]);

  return { available, registered, error };
}
