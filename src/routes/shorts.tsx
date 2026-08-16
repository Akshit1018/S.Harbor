import { createFileRoute, Link } from "@tanstack/react-router";
import { Archive, ChevronDown, ChevronUp } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { EmptyState, LargeTitle } from "@/components/ios";
import { Onboarding } from "@/components/onboarding";
import { YtFrame } from "@/components/player";
import { Button } from "@/components/ui/button";
import { useShortsVideos } from "@/lib/selectors";
import { displayTitle, useZeroStore } from "@/lib/store";
import { useFeedSync } from "@/lib/use-feed";

export const Route = createFileRoute("/shorts")({ component: ShortsPage });

function ShortsPage() {
  const onboarded = useZeroStore((s) => s.onboarded);
  const shorts = useShortsVideos();
  useFeedSync();
  const [index, setIndex] = useState(0);

  if (!onboarded) return <Onboarding />;

  return (
    <AppShell>
      <LargeTitle
        title="Shorts"
        subtitle="Vertical clips from followed channels only"
      />
      {shorts.length === 0 ? (
        <EmptyState
          title="No shorts in the pile"
          body="When a channel you follow posts a short, it shows up here as a stack — never from accounts you did not choose."
        />
      ) : (
        <ShortsStack
          ids={shorts.map((s) => s.id)}
          index={Math.min(index, shorts.length - 1)}
          setIndex={setIndex}
        />
      )}
    </AppShell>
  );
}

function ShortsStack({
  ids,
  index,
  setIndex,
}: {
  ids: string[];
  index: number;
  setIndex: (n: number) => void;
}) {
  const video = useZeroStore((s) => s.videos[ids[index] ?? ""]);
  const meta = useZeroStore((s) => (video ? s.meta[video.id] : undefined));
  const dearrow = useZeroStore((s) => s.settings.dearrow);
  const setProgress = useZeroStore((s) => s.setProgress);
  const setStatus = useZeroStore((s) => s.setStatus);

  const title = video ? displayTitle(video, meta, dearrow) : "";

  const go = (dir: 1 | -1) => {
    const next = index + dir;
    if (next < 0 || next >= ids.length) return;
    setIndex(next);
  };

  const onProgress = useMemo(
    () => (ratio: number, seconds: number) => {
      if (video) setProgress(video.id, ratio, seconds);
    },
    [setProgress, video],
  );

  const startY = useRef(0);

  if (!video) return null;

  return (
    <div
      className="mx-auto flex max-w-sm flex-col gap-3"
      onTouchStart={(e) => {
        startY.current = e.touches[0]?.clientY ?? 0;
      }}
      onTouchEnd={(e) => {
        const y = e.changedTouches[0]?.clientY ?? startY.current;
        const dy = startY.current - y;
        if (dy > 56) go(1);
        else if (dy < -56) go(-1);
      }}
    >
      <div className="relative aspect-[9/16] max-h-[62dvh] overflow-hidden rounded-xl bg-elevated">
        <YtFrame videoId={video.id} onProgress={onProgress} onEnded={() => go(1)} />
      </div>
      <div>
        <Link
          to="/watch/$videoId"
          params={{ videoId: video.id }}
          className="font-medium leading-snug"
        >
          {title}
        </Link>
        <p className="mt-1 text-sm text-muted">{video.channelTitle}</p>
      </div>
      <div className="flex items-center justify-between">
        <Button
          variant="secondary"
          size="icon"
          disabled={index === 0}
          onClick={() => go(-1)}
          aria-label="Previous short"
        >
          <ChevronUp />
        </Button>
        <span className="tabular-nums text-xs text-muted">
          {index + 1} / {ids.length}
        </span>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Clear"
            onClick={() => {
              setStatus(video.id, "archived");
              go(1);
            }}
          >
            <Archive />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            disabled={index >= ids.length - 1}
            onClick={() => go(1)}
            aria-label="Next short"
          >
            <ChevronDown />
          </Button>
        </div>
      </div>
    </div>
  );
}
