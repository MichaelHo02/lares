"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

interface StudioInteractionValue {
  orbitEnabled: boolean;
  setOrbitEnabled: (enabled: boolean) => void;
}

const StudioInteractionContext = createContext<StudioInteractionValue | null>(null);

export function StudioInteractionProvider({ children }: { children: ReactNode }) {
  const [orbitEnabled, setOrbitEnabled] = useState(true);
  const value = useMemo(
    () => ({ orbitEnabled, setOrbitEnabled }),
    [orbitEnabled],
  );
  return (
    <StudioInteractionContext.Provider value={value}>
      {children}
    </StudioInteractionContext.Provider>
  );
}

export function useStudioInteraction(): StudioInteractionValue {
  const value = useContext(StudioInteractionContext);
  if (!value) {
    throw new Error("useStudioInteraction must be used within StudioInteractionProvider");
  }
  return value;
}
