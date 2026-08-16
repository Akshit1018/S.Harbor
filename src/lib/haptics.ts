import { useZeroStore } from "./store";

export function haptic(kind: "light" | "success" | "warning" = "light") {
  if (typeof navigator === "undefined") return;
  if (!useZeroStore.getState().settings.haptics) return;
  const pattern =
    kind === "warning" ? [12, 24, 12] : kind === "success" ? [8, 16, 8] : [10];
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* ignore */
  }
}
