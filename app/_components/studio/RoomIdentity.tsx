"use client";

import { useEffect, useState, type FocusEvent, type KeyboardEvent } from "react";
import {
  formatMetresInput,
  parseRoomDimensionToMm,
  type Mm,
} from "@/lib/domain/units";
import { patchRoom } from "@/lib/store/operations";
import { usePlannerStore } from "@/lib/store/store";
import { MAX_ROOM_DIMENSION_MM, MIN_ROOM_DIMENSION_MM } from "@/lib/webmcp/schema";

const EMPTY_NAME = "New studio";
const FALLBACK_NAME = "Room";

function resolveName(draft: string, hasRoom: boolean): string {
  const trimmed = draft.trim();
  if (trimmed) return trimmed;
  return hasRoom ? FALLBACK_NAME : EMPTY_NAME;
}

function parseSize(raw: string): Mm | null {
  return parseRoomDimensionToMm(raw, MIN_ROOM_DIMENSION_MM, MAX_ROOM_DIMENSION_MM);
}

const fieldClass =
  "min-h-7 rounded-input bg-transparent px-1.5 text-ink outline-none " +
  "hover:bg-surface/80 focus:bg-surface focus:shadow-ring-ink";

/**
 * Compact title + size editor. Shoppers start a room here; the agent uses the
 * same `defineRoom` store path.
 */
export function RoomIdentity() {
  const room = usePlannerStore((state) => state.room);
  const [nameDraft, setNameDraft] = useState(room?.name ?? "");
  const [widthDraft, setWidthDraft] = useState(room ? formatMetresInput(room.widthMm) : "4.2");
  const [depthDraft, setDepthDraft] = useState(room ? formatMetresInput(room.depthMm) : "3.8");
  const [editingSize, setEditingSize] = useState(false);

  useEffect(() => {
    setNameDraft(room?.name ?? "");
    if (!editingSize) {
      setWidthDraft(room ? formatMetresInput(room.widthMm) : "4.2");
      setDepthDraft(room ? formatMetresInput(room.depthMm) : "3.8");
    }
  }, [room, editingSize]);

  const widthMm = parseSize(widthDraft);
  const depthMm = parseSize(depthDraft);
  const canDraw = widthMm !== null && depthMm !== null;

  function commitName() {
    const name = resolveName(nameDraft, Boolean(room));
    setNameDraft(room ? name : nameDraft);
    if (!room) return;
    if (name === room.name) return;
    patchRoom({ name, source: "user" });
  }

  function revertName() {
    setNameDraft(room?.name ?? "");
  }

  function commitSize() {
    if (widthMm === null || depthMm === null) {
      if (room) {
        setWidthDraft(formatMetresInput(room.widthMm));
        setDepthDraft(formatMetresInput(room.depthMm));
      }
      setEditingSize(false);
      return;
    }
    if (room && widthMm === room.widthMm && depthMm === room.depthMm) {
      setEditingSize(false);
      return;
    }
    patchRoom({
      name: resolveName(nameDraft, Boolean(room)),
      widthMm,
      depthMm,
      source: "user",
    });
    setEditingSize(false);
  }

  function onNameKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      commitName();
      event.currentTarget.blur();
    }
    if (event.key === "Escape") {
      event.preventDefault();
      revertName();
      event.currentTarget.blur();
    }
  }

  function onSizeKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      commitSize();
    }
    if (event.key === "Escape") {
      event.preventDefault();
      if (room) {
        setWidthDraft(formatMetresInput(room.widthMm));
        setDepthDraft(formatMetresInput(room.depthMm));
      } else {
        setWidthDraft("4.2");
        setDepthDraft("3.8");
      }
      setEditingSize(false);
      event.currentTarget.blur();
    }
  }

  function onSizeGroupBlur(event: FocusEvent<HTMLDivElement>) {
    if (event.currentTarget.contains(event.relatedTarget)) return;
    if (!room && !canDraw) return;
    commitSize();
  }

  return (
    <div className="min-w-0">
      <p className="flex min-w-0 items-baseline gap-1 text-heading-s font-bold text-ink">
        <span className="rounded-badge bg-accent-yellow px-1.5">Lares</span>
        <span className="text-ink-3">/</span>
        <input
          aria-label="Room name"
          value={nameDraft}
          onChange={(event) => setNameDraft(event.target.value)}
          onBlur={commitName}
          onKeyDown={onNameKeyDown}
          onFocus={(event) => event.currentTarget.select()}
          placeholder={EMPTY_NAME}
          className={`${fieldClass} min-w-0 flex-1 text-heading-s font-bold text-ink-2 placeholder:text-ink-3`}
        />
      </p>
      {room && !editingSize ? (
        <button
          type="button"
          onClick={() => setEditingSize(true)}
          className="text-caption-m mt-0.5 cursor-text tabular-nums text-ink-3 hover:text-ink"
        >
          {room.widthMm} × {room.depthMm}mm
        </button>
      ) : (
        <div
          className="mt-0.5 flex flex-wrap items-center gap-1.5"
          onBlur={onSizeGroupBlur}
        >
          <input
            aria-label="Room width in metres"
            inputMode="decimal"
            value={widthDraft}
            onChange={(event) => setWidthDraft(event.target.value)}
            onKeyDown={onSizeKeyDown}
            onFocus={() => setEditingSize(true)}
            placeholder="4.2"
            className={`${fieldClass} text-caption-m w-14 tabular-nums text-ink-2 placeholder:text-ink-3`}
          />
          <span className="text-caption-m text-ink-3">×</span>
          <input
            aria-label="Room depth in metres"
            inputMode="decimal"
            value={depthDraft}
            onChange={(event) => setDepthDraft(event.target.value)}
            onKeyDown={onSizeKeyDown}
            onFocus={() => setEditingSize(true)}
            placeholder="3.8"
            className={`${fieldClass} text-caption-m w-14 tabular-nums text-ink-2 placeholder:text-ink-3`}
          />
          <span className="text-caption-m text-ink-3">m</span>
          {!room ? (
            <button
              type="button"
              disabled={!canDraw}
              onClick={commitSize}
              className="text-label-s font-bold text-ink disabled:text-ink-3"
            >
              Draw room
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
