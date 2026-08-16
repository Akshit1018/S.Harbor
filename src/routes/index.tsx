import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ChannelAvatar } from "@/components/channel-avatar";
import { EmptyState, FeedSkeleton, Group, LargeTitle, Segmented } from "@/components/ios";
import { PullRefresh } from "@/components/pull-refresh";
import { Button } from "@/components/ui/button";
import { VideoFeed } from "@/components/video-feed";
import {
  useContinueVideos,
  useFreshVideos,
  useInboxVideos,
  useInboxVideosUnfiltered,
  useLaterVideos,
} from "@/lib/selectors";
import {
  currentLaterBucket,
  estimateMinutes,
  formatMinutes,
} from "@/lib/schedule";
import { displayTitle, useZeroStore } from "@/lib/store";
import type { Focus, LiveStream } from "@/lib/types";
import { greetingFor } from "@/lib/types";
import { useFeedSync } from "@/lib/use-feed";
import { checkLive } from "@/lib/youtube";

export const Route = createFileRoute("/")({ component: TodayPage });

function TodayPage() {
  const channels = useZeroStore((s) => s.channels);
  const pinnedIds = useZeroStore((s) => s.pinnedIds);
  const inbox = useInboxVideos();
  const allInbox = useInboxVideosUnfiltered();
  const fresh = useFreshVideos();
  const cont = useContinueVideos();
  const readyBucket = currentLaterBucket();
  const ready = useLaterVideos(readyBucket);
  const focus = useZeroStore((s) => s.focus);
  const setFocus = useZeroStore((s) => s.setFocus);
  const { refresh, status } = useFeedSync();
  const [live, setLive] = useState<LiveStream[]>([]);

  const pinned = channels.filter((c) => pinnedIds.includes(c.id));
  const greeting = greetingFor();
  const pile = focus === "fresh" ? fresh : inbox;
  const minutes = estimateMinutes(pile);

  const onRefresh = useCallback(() => refresh(true), [refresh]);

  useEffect(() => {
    if (!channels.length) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void checkLive({
        data: {
          channels: channels.slice(0, 6).map((c) => ({ id: c.id, handle: c.handle })),
        },
      })
        .then((rows) => {
          if (!cancelled) setLive(rows);
        })
        .catch(() => {
          if (!cancelled) setLive([]);
        });
    }, 5000);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [channels]);

  return (
    <AppShell>
      <PullRefresh onRefresh={onRefresh}>
        <LargeTitle
          title={greeting}
          subtitle={
            inbox.length === 0
              ? status === "loading"
                ? "Updating your channels…"
                : "Nothing waiting."
              : `${inbox.length} ready · ${formatMinutes(minutes)}`
          }
          action={
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:inline-flex"
              onClick={() => void refresh(true)}
              disabled={status === "loading"}
            >
              {status === "loading" ? "Updating" : "Refresh"}
            </Button>
          }
        />

        <Segmented<Focus>
          value={focus}
          onChange={setFocus}
          options={[
            { id: "all", label: "All" },
            { id: "fresh", label: "New" },
            { id: "evening", label: "Evening" },
          ]}
        />

        {fresh.length > 0 && focus !== "fresh" && (
          <button
            type="button"
            onClick={() => setFocus("fresh")}
            className="mt-5 w-full rounded-xl bg-surface px-4 py-3 text-left"
          >
            <p className="text-sm font-semibold">Since you left</p>
            <p className="mt-0.5 text-xs text-muted">
              {fresh.length} new upload{fresh.length === 1 ? "" : "s"} from your channels
            </p>
          </button>
        )}

        {live.length > 0 && (
          <div className="mt-5">
            {live.map((item) => {
              const ch = channels.find((c) => c.id === item.channelId);
              return (
                <Link
                  key={item.videoId}
                  to="/watch/$videoId"
                  params={{ videoId: item.videoId }}
                  className="mb-2 flex items-center gap-3 rounded-xl bg-surface px-3 py-3"
                >
                  <span className="rounded-full bg-live px-2 py-0.5 text-xs font-semibold text-live-fg">
                    LIVE
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {item.title}
                  </span>
                  <span className="text-xs text-muted">{ch?.title}</span>
                </Link>
              );
            })}
          </div>
        )}

        {pinned.length > 0 && (
          <div className="mt-5">
            <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-subtle">
              Pinned
            </p>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-1">
              {pinned.map((c) => (
                <Link
                  key={c.id}
                  to="/channel/$channelId"
                  params={{ channelId: c.id }}
                  className="flex w-16 shrink-0 flex-col items-center gap-1.5"
                >
                  <ChannelAvatar title={c.title} src={c.thumbnail} size="lg" />
                  <span className="w-full truncate text-center text-xs text-muted">
                    {c.title}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {cont.length > 0 && (
          <div className="mt-6">
            <p className="mb-2 px-1 text-sm font-semibold">Continue</p>
            <ContinueRail videos={cont} />
          </div>
        )}

        {ready.length > 0 && (
          <div className="mt-6">
            <p className="mb-2 px-1 text-sm font-semibold">Ready now</p>
            <Group>
              {ready.slice(0, 4).map((v, i, arr) => (
                <SavedLine
                  key={v.id}
                  id={v.id}
                  label={readyBucket === "tonight" ? "Tonight" : readyBucket === "weekend" ? "Weekend" : "Today"}
                  last={i === arr.length - 1}
                />
              ))}
            </Group>
          </div>
        )}

        <div className="mt-6">
          <div className="mb-2 flex items-baseline justify-between px-1">
            <p className="text-sm font-semibold">
              {focus === "fresh"
                ? "New this session"
                : focus === "evening"
                  ? "Evening pile"
                  : "Up next"}
            </p>
            <Link to="/inbox" className="text-sm text-accent">
              See all
            </Link>
          </div>
          {channels.length === 0 ? (
            <EmptyState
              title="Follow someone"
              body="Harbor stays empty until you choose channels. Nothing is recommended."
              action={
                <Button asChild>
                  <Link to="/you">Add channels</Link>
                </Button>
              }
            />
          ) : status === "error" && pile.length === 0 ? (
            <EmptyState
              title="Couldn’t update"
              body="The public feeds did not respond. Pull down to try again — nothing is recommended in the meantime."
              action={
                <Button variant="secondary" onClick={() => void refresh(true)}>
                  Try again
                </Button>
              }
            />
          ) : pile.length === 0 && status === "loading" ? (
            <FeedSkeleton />
          ) : pile.length === 0 && focus === "evening" && allInbox.length > 0 ? (
            <EmptyState
              title="Evening is quiet"
              body="Shorts are hidden after 8. Your full pile is still in All."
              action={
                <Button variant="secondary" onClick={() => setFocus("all")}>
                  Show all
                </Button>
              }
            />
          ) : pile.length === 0 ? (
            <EmptyState
              title="You’re clear"
              body="That’s the point. New uploads will land here — still no algorithm."
            />
          ) : (
            <VideoFeed videos={pile.slice(0, 12)} swipe />
          )}
        </div>

        {status === "loading" && pile.length > 0 && (
          <p className="mt-4 text-center text-xs text-subtle">Updating feeds</p>
        )}
      </PullRefresh>
    </AppShell>
  );
}

function ContinueRail({
  videos,
}: {
  videos: { id: string; title: string; thumbnail: string; channelTitle: string }[];
}) {
  const meta = useZeroStore((s) => s.meta);
  const dearrow = useZeroStore((s) => s.settings.dearrow);
  const all = useZeroStore((s) => s.videos);
  return (
    <div className="flex gap-3 overflow-x-auto no-scrollbar">
      {videos.slice(0, 8).map((v) => {
        const full = all[v.id] ?? v;
        return (
          <Link
            key={v.id}
            to="/watch/$videoId"
            params={{ videoId: v.id }}
            className="w-40 shrink-0"
          >
            <div className="relative aspect-video overflow-hidden rounded-lg bg-elevated">
              <img
                src={v.thumbnail}
                alt=""
                className="size-full object-cover"
                referrerPolicy="no-referrer"
              />
              <span className="absolute inset-x-0 bottom-0 h-1 bg-fill">
                <span
                  className="block h-full bg-accent"
                  style={{ width: `${Math.min(100, (meta[v.id]?.progress ?? 0) * 100)}%` }}
                />
              </span>
            </div>
            <p className="mt-1.5 line-clamp-2 text-xs font-medium">
              {displayTitle(full as typeof full & { title: string }, meta[v.id], dearrow)}
            </p>
          </Link>
        );
      })}
    </div>
  );
}

function SavedLine({ id, label, last }: { id: string; label: string; last: boolean }) {
  const video = useZeroStore((s) => s.videos[id]);
  const meta = useZeroStore((s) => s.meta[id]);
  const dearrow = useZeroStore((s) => s.settings.dearrow);
  if (!video) return null;
  return (
    <Link
      to="/watch/$videoId"
      params={{ videoId: id }}
      className={`flex items-center gap-3 px-3 py-2.5 ${last ? "" : "shadow-[inset_0_-0.5px_0_var(--color-border)]"}`}
    >
      <img
        src={video.thumbnail}
        alt=""
        className="h-11 w-20 rounded-md object-cover"
        referrerPolicy="no-referrer"
      />
      <span className="min-w-0 flex-1">
        <span className="line-clamp-1 text-sm">{displayTitle(video, meta, dearrow)}</span>
        <span className="text-xs text-muted">{label}</span>
      </span>
    </Link>
  );
}
