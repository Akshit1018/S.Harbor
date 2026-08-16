import { useRef, useState, type ReactNode } from "react";
import { haptic } from "@/lib/haptics";

export function SwipeRow({
  onArchive,
  onLater,
  children,
}: {
  onArchive: () => void;
  onLater: () => void;
  children: ReactNode;
}) {
  const startX = useRef(0);
  const [dx, setDx] = useState(0);
  const fired = useRef(false);

  function end(next: number) {
    if (next < -72) {
      setDx(-80);
    } else if (next > 72) {
      setDx(80);
    } else {
      setDx(0);
    }
    fired.current = false;
  }

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-y-0 left-0 flex w-20 items-stretch">
        <button
          type="button"
          className="w-20 bg-accent text-xs font-semibold text-accent-fg"
          onClick={() => {
            haptic("success");
            onLater();
            setDx(0);
          }}
        >
          Later
        </button>
      </div>
      <div className="absolute inset-y-0 right-0 flex w-20 items-stretch">
        <button
          type="button"
          className="w-20 bg-live text-xs font-semibold text-live-fg"
          onClick={() => {
            haptic("warning");
            onArchive();
            setDx(0);
          }}
        >
          Clear
        </button>
      </div>
      <div
        className="relative bg-surface transition-transform duration-150 ease-out"
        style={{ transform: `translateX(${dx}px)` }}
        onTouchStart={(e) => {
          startX.current = e.touches[0]?.clientX ?? 0;
        }}
        onTouchMove={(e) => {
          const x = e.touches[0]?.clientX ?? 0;
          const next = Math.max(-96, Math.min(96, x - startX.current));
          setDx(next);
          if (!fired.current && (next < -72 || next > 72)) {
            fired.current = true;
            haptic("light");
          }
        }}
        onTouchEnd={() => end(dx)}
      >
        {children}
      </div>
    </div>
  );
}
