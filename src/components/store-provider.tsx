import { useLayoutEffect, type ReactNode } from "react";
import { Onboarding } from "@/components/onboarding";
import { useHasHydrated, useZeroStore } from "@/lib/store";

export function StoreProvider({ children }: { children: ReactNode }) {
  const hydrated = useHasHydrated();
  const onboarded = useZeroStore((s) => s.onboarded);

  useLayoutEffect(() => {
    if (!hydrated) return;
    useZeroStore.getState().beginSession();
  }, [hydrated]);

  if (!hydrated) {
    return <div className="min-h-dvh bg-bg" aria-busy="true" />;
  }

  if (!onboarded) return <Onboarding />;

  return children;
}
