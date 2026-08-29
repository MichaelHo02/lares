"use client";

import { useEffect, useRef } from "react";
import type { ResolvedPlacement } from "@/lib/domain/placement";
import { ROTATIONS, type Rotation } from "@/lib/geometry/rotation";
import { SNAP_MM } from "@/lib/canvas/viewport";
import {
  moveItem,
  removeItem,
  rotateItem,
  selectPlacement,
} from "@/lib/store/operations";

const COARSE_NUDGE_MM = SNAP_MM * 10;

const NUDGE_KEYS: Record<string, { dx: number; dy: number }> = {
  ArrowLeft: { dx: -1, dy: 0 },
  ArrowRight: { dx: 1, dy: 0 },
  ArrowUp: { dx: 0, dy: -1 },
  ArrowDown: { dx: 0, dy: 1 },
};

function nextRotation(current: Rotation): Rotation {
  return ROTATIONS[(ROTATIONS.indexOf(current) + 1) % ROTATIONS.length];
}

/**
 * SketchUp-style keyboard edits against the shared store so the 3D viewport
 * and the agent stay in sync.
 */
export function useStudioKeyboard(
  resolved: readonly ResolvedPlacement[],
  selectedId: string | null,
): void {
  const latest = useRef({ resolved, selectedId });
  useEffect(() => {
    latest.current = { resolved, selectedId };
  }, [resolved, selectedId]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.isContentEditable) return;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
        return;
      }

      const { resolved: items, selectedId: id } = latest.current;
      if (!id) return;
      const entry = items.find((item) => item.placement.id === id);
      if (!entry) return;

      const nudge = NUDGE_KEYS[event.key];
      if (nudge) {
        event.preventDefault();
        const step = event.shiftKey ? COARSE_NUDGE_MM : SNAP_MM;
        moveItem({
          placementId: id,
          x: entry.placement.x + nudge.dx * step,
          y: entry.placement.y + nudge.dy * step,
          source: "user",
        });
        return;
      }

      if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        rotateItem({
          placementId: id,
          rotation: nextRotation(entry.placement.rotation),
          source: "user",
        });
        return;
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        removeItem(id, "user");
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        selectPlacement(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
