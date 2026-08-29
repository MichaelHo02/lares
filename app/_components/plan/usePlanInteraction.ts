"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { ResolvedPlacement } from "@/lib/domain/placement";
import type { Room } from "@/lib/domain/room";
import { ROTATIONS, type Rotation } from "@/lib/geometry/rotation";
import {
  SNAP_MM,
  clientToRoom,
  snapFootprint,
  snapToGrid,
} from "@/lib/canvas/viewport";
import { moveItem, removeItem, rotateItem, selectPlacement } from "@/lib/store/operations";

interface DragState {
  placementId: string;
  pointerId: number;
  /** Grab point measured from the footprint's north-west corner. */
  offsetX: number;
  offsetY: number;
}

/** Holding Shift while nudging moves a whole grid decade at a time. */
const COARSE_NUDGE_MM = SNAP_MM * 10;

const NUDGE_KEYS: Record<string, { dx: number; dy: number }> = {
  ArrowLeft: { dx: -1, dy: 0 },
  ArrowRight: { dx: 1, dy: 0 },
  ArrowUp: { dx: 0, dy: -1 },
  ArrowDown: { dx: 0, dy: 1 },
};

export function nextRotation(current: Rotation): Rotation {
  return ROTATIONS[(ROTATIONS.indexOf(current) + 1) % ROTATIONS.length];
}

interface UsePlanInteractionInput {
  svgRef: React.RefObject<SVGSVGElement | null>;
  room: Room;
  resolved: readonly ResolvedPlacement[];
  selectedId: string | null;
}

export function usePlanInteraction({
  svgRef,
  room,
  resolved,
  selectedId,
}: UsePlanInteractionInput) {
  const [drag, setDrag] = useState<DragState | null>(null);

  // Keyboard handling reads the current selection without re-binding the listener.
  const latest = useRef({ resolved, selectedId });
  useEffect(() => {
    latest.current = { resolved, selectedId };
  }, [resolved, selectedId]);

  const beginDrag = useCallback(
    (event: ReactPointerEvent<SVGGElement>, placementId: string) => {
      const svg = svgRef.current;
      const entry = resolved.find((item) => item.placement.id === placementId);
      if (!svg || !entry) return;

      const point = clientToRoom(svg, event.clientX, event.clientY);
      if (!point) return;

      event.preventDefault();
      event.stopPropagation();
      event.currentTarget.setPointerCapture(event.pointerId);
      selectPlacement(placementId);
      setDrag({
        placementId,
        pointerId: event.pointerId,
        offsetX: point.x - entry.footprint.x,
        offsetY: point.y - entry.footprint.y,
      });
    },
    [resolved, svgRef],
  );

  const updateDrag = useCallback(
    (event: ReactPointerEvent<SVGSVGElement>) => {
      const svg = svgRef.current;
      if (!drag || !svg || event.pointerId !== drag.pointerId) return;

      const entry = resolved.find((item) => item.placement.id === drag.placementId);
      const point = clientToRoom(svg, event.clientX, event.clientY);
      if (!entry || !point) return;

      const snapped = snapFootprint(
        point.x - drag.offsetX,
        point.y - drag.offsetY,
        entry.footprint.width,
        entry.footprint.depth,
        room,
      );
      moveItem({
        placementId: drag.placementId,
        x: snapped.x,
        y: snapped.y,
        source: "user",
      });
    },
    [drag, resolved, room, svgRef],
  );

  const endDrag = useCallback(() => setDrag(null), []);

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
          x: snapToGrid(entry.footprint.x + nudge.dx * step),
          y: snapToGrid(entry.footprint.y + nudge.dy * step),
          source: "user",
        });
        return;
      }

      switch (event.key) {
        case "r":
        case "R":
          event.preventDefault();
          rotateItem({
            placementId: id,
            rotation: nextRotation(entry.placement.rotation),
            source: "user",
          });
          break;
        case "Delete":
        case "Backspace":
          event.preventDefault();
          removeItem(id, "user");
          break;
        case "Escape":
          selectPlacement(null);
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return { drag, beginDrag, updateDrag, endDrag };
}
