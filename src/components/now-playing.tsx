import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import { displayTitle, useZeroStore } from "@/lib/store";

export function NowPlayingBar() {
  const id = useZeroStore((s) => s.nowPlayingId);
  const video = useZeroStore((s) => (id ? s.videos[id] : undefined));
  const meta = useZeroStore((s) => (id ? s.meta[id] : undefined));
  const dearrow = useZeroStore((s) => s.settings.dearrow);
  const setNowPlaying = useZeroStore((s) => s.setNowPlaying);
  if (!id || !video) return null;
  const progress = meta?.progress ?? 0;

  return (
    <div className="fixed inset-x-0 z-30 px-2" style={{ bottom: "calc(3rem + env(safe-area-inset-bottom, 0px))" }}>
      <div className="relative mx-auto flex max-w-xl items-center gap-3 rounded-xl bg-elevated/95 px-2 py-2 shadow-[0_0_0_1px_rgb(255_255_255/0.08)] backdrop-blur-xl">
        <Link
          to="/watch/$videoId"
          params={{ videoId: id }}
          search={{ play: true }}
          className="flex min-w-0 flex-1 items-center gap-3"
        >
          <img
            src={video.thumbnail}
            alt=""
            className="h-10 w-[4.5rem] rounded-md object-cover"
            referrerPolicy="no-referrer"
          />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">
              {displayTitle(video, meta, dearrow)}
            </span>
            <span className="block truncate text-xs text-muted">{video.channelTitle}</span>
          </span>
        </Link>
        <button
          type="button"
          aria-label="Dismiss player"
          className="grid size-10 place-items-center text-subtle"
          onClick={() => setNowPlaying(null)}
        >
          <X className="size-4" />
        </button>
        {progress > 0.04 && (
          <span className="pointer-events-none absolute inset-x-3 bottom-1 h-0.5 rounded-full bg-fill">
            <span
              className="block h-full rounded-full bg-accent"
              style={{ width: `${Math.min(100, progress * 100)}%` }}
            />
          </span>
        )}
      </div>
    </div>
  );
}
