import { useEffect, useRef, useState, type ReactNode } from "react";

const THRESHOLD = 68;

export function PullRefresh({
  onRefresh,
  children,
}: {
  onRefresh: () => Promise<void> | void;
  children: ReactNode;
}) {
  const startY = useRef(0);
  const pulling = useRef(false);
  const offsetRef = useRef(0);
  const [offset, setOffset] = useState(0);
  const [busy, setBusy] = useState(false);
  const refreshRef = useRef(onRefresh);
  refreshRef.current = onRefresh;

  useEffect(() => {
    function set(next: number) {
      offsetRef.current = next;
      setOffset(next);
    }
    function onStart(e: TouchEvent) {
      if (window.scrollY > 2 || busy) {
        pulling.current = false;
        return;
      }
      pulling.current = true;
      startY.current = e.touches[0]?.clientY ?? 0;
    }
    function onMove(e: TouchEvent) {
      if (!pulling.current || busy) return;
      const y = e.touches[0]?.clientY ?? 0;
      const dy = y - startY.current;
      if (dy > 0) set(Math.min(96, dy * 0.46));
    }
    async function onEnd() {
      if (!pulling.current) return;
      pulling.current = false;
      if (offsetRef.current >= THRESHOLD) {
        set(44);
        setBusy(true);
        try {
          await refreshRef.current();
        } finally {
          setBusy(false);
          set(0);
        }
      } else {
        set(0);
      }
    }
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onEnd);
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
    };
  }, [busy]);

  return (
    <div>
      <div
        className="flex items-end justify-center overflow-hidden text-xs text-muted transition-[height] duration-150 ease-out"
        style={{ height: offset }}
      >
        {(offset > 10 || busy) && (
          <span className="pb-2">
            {busy ? "Updating" : offset >= THRESHOLD ? "Release" : "Pull to refresh"}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
