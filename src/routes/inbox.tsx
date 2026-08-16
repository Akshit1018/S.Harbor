import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Chip, ChipRow, EmptyState, FeedSkeleton, LargeTitle, SearchField } from "@/components/ios";
import { PullRefresh } from "@/components/pull-refresh";
import { Button } from "@/components/ui/button";
import { VideoFeed } from "@/components/video-feed";
import { haptic } from "@/lib/haptics";
import { useKeys } from "@/lib/keys";
import { useInboxVideos } from "@/lib/selectors";
import { estimateMinutes, formatMinutes, snoozeUntil } from "@/lib/schedule";
import { useZeroStore } from "@/lib/store";
import { useFeedSync } from "@/lib/use-feed";

export const Route = createFileRoute("/inbox")({ component: InboxPage });

function InboxPage() {
  const channels = useZeroStore((s) => s.channels);
  const videos = useInboxVideos();
  const query = useZeroStore((s) => s.query);
  const setQuery = useZeroStore((s) => s.setQuery);
  const markCaughtUp = useZeroStore((s) => s.markCaughtUp);
  const restoreMany = useZeroStore((s) => s.restoreMany);
  const setStatus = useZeroStore((s) => s.setStatus);
  const restore = useZeroStore((s) => s.restoreVideo);
  const snoozeVideo = useZeroStore((s) => s.snoozeVideo);
  const { refresh, status } = useFeedSync();
  const [channelId, setChannelId] = useState<string | "all">("all");
  const [focus, setFocus] = useState(0);
  const navigate = useNavigate();

  const onRefresh = useCallback(() => refresh(true), [refresh]);

  const channelChips = useMemo(() => {
    const counts = new Map<string, { title: string; n: number }>();
    for (const v of videos) {
      const prev = counts.get(v.channelId);
      counts.set(v.channelId, {
        title: v.channelTitle,
        n: (prev?.n ?? 0) + 1,
      });
    }
    return [...counts.entries()]
      .sort((a, b) => b[1].n - a[1].n)
      .slice(0, 8);
  }, [videos]);

  const visible =
    channelId === "all" ? videos : videos.filter((v) => v.channelId === channelId);

  useEffect(() => {
    if (focus >= visible.length) setFocus(Math.max(0, visible.length - 1));
  }, [focus, visible.length]);

  const current = visible[focus];

  useEffect(() => {
    if (!current) return;
    document.getElementById(`video-${current.id}`)?.scrollIntoView({
      block: "nearest",
    });
  }, [current]);

  const catchUp = () => {
    if (!visible.length) return;
    const ids = visible.map((v) => v.id);
    haptic("success");
    markCaughtUp(ids);
    toast(`Caught up · ${ids.length}`, {
      action: { label: "Undo", onClick: () => restoreMany(ids) },
    });
  };

  useKeys(
    {
      j: () => setFocus((i) => Math.min(visible.length - 1, i + 1)),
      ArrowDown: () => setFocus((i) => Math.min(visible.length - 1, i + 1)),
      k: () => setFocus((i) => Math.max(0, i - 1)),
      ArrowUp: () => setFocus((i) => Math.max(0, i - 1)),
      Enter: () => {
        if (!current) return;
        void navigate({ to: "/watch/$videoId", params: { videoId: current.id } });
      },
      o: () => {
        if (!current) return;
        void navigate({ to: "/watch/$videoId", params: { videoId: current.id } });
      },
      e: () => {
        if (!current) return;
        haptic("warning");
        setStatus(current.id, "archived");
        toast("Cleared", { action: { label: "Undo", onClick: () => restore(current.id) } });
      },
      l: () => {
        if (!current) return;
        haptic("success");
        setStatus(current.id, "later", "today");
        toast("Saved for today", { action: { label: "Undo", onClick: () => restore(current.id) } });
      },
      s: () => {
        if (!current) return;
        snoozeVideo(current.id, snoozeUntil("tonight"));
        toast("Hidden until tonight");
      },
      c: () => catchUp(),
      "/": () => document.getElementById("inbox-search")?.focus(),
    },
    visible.length > 0,
  );

  return (
    <AppShell>
      <PullRefresh onRefresh={onRefresh}>
        <LargeTitle
          title="Inbox"
          subtitle={
            visible.length === 0
              ? status === "loading"
                ? "Updating your channels…"
                : "Zero waiting"
              : `${visible.length} unwatched · ${formatMinutes(estimateMinutes(visible))}`
          }
          action={
            visible.length > 0 ? (
              <Button variant="ghost" size="sm" onClick={catchUp}>
                Catch up
              </Button>
            ) : undefined
          }
        />
        <SearchField
          id="inbox-search"
          value={query}
          onChange={setQuery}
          placeholder="Search titles and channels"
        />
        {channelChips.length > 1 && (
          <div className="mt-3">
            <ChipRow>
              <Chip active={channelId === "all"} onClick={() => setChannelId("all")}>
                All
              </Chip>
              {channelChips.map(([id, info]) => (
                <Chip
                  key={id}
                  active={channelId === id}
                  onClick={() => setChannelId(id)}
                >
                  {info.title}
                </Chip>
              ))}
            </ChipRow>
          </div>
        )}
        <div className="mt-4">
          {channels.length === 0 ? (
            <EmptyState
              title="No channels"
              body="Follow people you already watch. Their uploads land here in order."
            />
          ) : status === "loading" && visible.length === 0 ? (
            <FeedSkeleton />
          ) : status === "error" && visible.length === 0 ? (
            <EmptyState
              title="Couldn’t update"
              body="Public RSS did not respond. Pull to try again."
              action={
                <Button variant="secondary" onClick={() => void refresh(true)}>
                  Try again
                </Button>
              }
            />
          ) : visible.length === 0 ? (
            <EmptyState
              title="Inbox is empty"
              body="That’s the finish line. Swipe clear, snooze, or save for tonight until nothing is left."
            />
          ) : (
            <VideoFeed videos={visible} swipe focusedId={current?.id} />
          )}
        </div>
      </PullRefresh>
    </AppShell>
  );
}
