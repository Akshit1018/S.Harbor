import { useEffect, useRef, useState } from "react";
import type { SkipSegment } from "@/lib/sponsor";
import { skipLabel } from "@/lib/sponsor";

export function YtFrame({
  videoId,
  onProgress,
  onEnded,
  autoplay = false,
  segments = [],
  start,
}: {
  videoId: string;
  onProgress: (ratio: number, seconds: number) => void;
  onEnded: () => void;
  autoplay?: boolean;
  segments?: SkipSegment[];
  start?: number;
}) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [src, setSrc] = useState("");
  const [banner, setBanner] = useState<string | null>(null);
  const skipped = useRef(new Set<string>());
  const segs = useRef(segments);
  segs.current = segments;

  useEffect(() => {
    skipped.current = new Set();
    setBanner(null);
    const params = new URLSearchParams({
      enablejsapi: "1",
      rel: "0",
      modestbranding: "1",
      playsinline: "1",
    });
    if (autoplay) params.set("autoplay", "1");
    if (start && start > 3) params.set("start", String(Math.floor(start)));
    setSrc(
      `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?${params.toString()}`,
    );
  }, [autoplay, start, videoId]);

  useEffect(() => {
    const iframe = ref.current;
    const seekTo = (seconds: number) => {
      iframe?.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: "seekTo", args: [seconds, true] }),
        "*",
      );
    };
    const onMessage = (event: MessageEvent) => {
      if (typeof event.data !== "string") return;
      try {
        const msg = JSON.parse(event.data) as {
          event?: string;
          info?: { currentTime?: number; duration?: number; playerState?: number };
        };
        if (msg.event === "infoDelivery" && msg.info) {
          const t = msg.info.currentTime;
          const d = msg.info.duration;
          if (typeof t === "number" && typeof d === "number" && d > 0) {
            onProgress(t / d, t);
            for (const seg of segs.current) {
              const key = `${seg.start}-${seg.end}`;
              if (skipped.current.has(key)) continue;
              if (t >= seg.start && t < seg.end - 0.35) {
                skipped.current.add(key);
                seekTo(seg.end);
                setBanner(skipLabel(seg.category));
                window.setTimeout(() => setBanner(null), 2200);
                break;
              }
            }
          }
          if (msg.info.playerState === 0) onEnded();
        }
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("message", onMessage);
    const id = window.setInterval(() => {
      iframe?.contentWindow?.postMessage(
        JSON.stringify({ event: "listening", id: 1 }),
        "*",
      );
    }, 800);
    return () => {
      window.removeEventListener("message", onMessage);
      window.clearInterval(id);
    };
  }, [onEnded, onProgress, videoId]);

  if (!src) {
    return <div className="aspect-video w-full bg-elevated" />;
  }

  return (
    <div className="relative size-full">
      <iframe
        ref={ref}
        src={src}
        title="Player"
        className="size-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
      {banner && (
        <div className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-bg/85 px-3 py-1 text-xs font-medium text-fg">
          {banner}
        </div>
      )}
    </div>
  );
}
