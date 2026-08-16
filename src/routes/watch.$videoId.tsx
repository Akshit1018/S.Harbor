import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, ExternalLink, Share } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ChannelAvatar } from "@/components/channel-avatar";
import { Onboarding } from "@/components/onboarding";
import { YtFrame } from "@/components/player";
import { Button } from "@/components/ui/button";
import { shareVideo } from "@/lib/format";
import { haptic } from "@/lib/haptics";
import { useKeys } from "@/lib/keys";
import { muteUntil, SNOOZE_OPTIONS, snoozeUntil } from "@/lib/schedule";
import type { SkipSegment } from "@/lib/sponsor";
import { displayTitle, useZeroStore } from "@/lib/store";
import { BUCKETS } from "@/lib/types";
import { fetchSkipSegments } from "@/lib/youtube";

export const Route = createFileRoute("/watch/$videoId")({
  validateSearch: (s: Record<string, unknown>) => {
    const play = s.play === 1 || s.play === "1" || s.play === true;
    return play ? { play: true as const } : {};
  },
  component: WatchPage,
});

function WatchPage() {
  const { videoId } = Route.useParams();
  const { play } = Route.useSearch();
  const onboarded = useZeroStore((s) => s.onboarded);
  const video = useZeroStore((s) => s.videos[videoId]);
  const channels = useZeroStore((s) => s.channels);
  const meta = useZeroStore((s) => s.meta[videoId]);
  const settings = useZeroStore((s) => s.settings);
  const setProgress = useZeroStore((s) => s.setProgress);
  const setStatus = useZeroStore((s) => s.setStatus);
  const setBucket = useZeroStore((s) => s.setBucket);
  const snoozeVideo = useZeroStore((s) => s.snoozeVideo);
  const muteChannel = useZeroStore((s) => s.muteChannel);
  const setNowPlaying = useZeroStore((s) => s.setNowPlaying);
  const note = useZeroStore((s) => s.notes[videoId] ?? "");
  const setNote = useZeroStore((s) => s.setNote);
  const lastList = useZeroStore((s) => s.lastList);
  const videos = useZeroStore((s) => s.videos);
  const allMeta = useZeroStore((s) => s.meta);
  const navigate = useNavigate();
  const [draft, setDraft] = useState(note);
  const [help, setHelp] = useState(false);
  const [segments, setSegments] = useState<SkipSegment[]>([]);

  const channel = channels.find((c) => c.id === video?.channelId);
  const title = video ? displayTitle(video, meta, settings.dearrow) : "Video";
  const idx = lastList.indexOf(videoId);
  const prevId = idx > 0 ? lastList[idx - 1] : undefined;
  const nextId = idx >= 0 && idx < lastList.length - 1 ? lastList[idx + 1] : undefined;
  const queue = lastList.filter((id) => id !== videoId);

  useEffect(() => {
    setNowPlaying(videoId);
    setDraft(useZeroStore.getState().notes[videoId] ?? "");
  }, [setNowPlaying, videoId]);

  useEffect(() => {
    if (!settings.sponsorBlock) {
      setSegments([]);
      return;
    }
    let cancelled = false;
    void fetchSkipSegments({ data: { videoId } })
      .then((rows) => {
        if (!cancelled) setSegments(rows);
      })
      .catch(() => {
        if (!cancelled) setSegments([]);
      });
    return () => {
      cancelled = true;
    };
  }, [settings.sponsorBlock, videoId]);

  const go = useCallback(
    (id?: string) => {
      if (!id) return;
      void navigate({ to: "/watch/$videoId", params: { videoId: id }, search: { play: true } });
    },
    [navigate],
  );

  const onProgress = useCallback(
    (ratio: number, seconds: number) => setProgress(videoId, ratio, seconds),
    [setProgress, videoId],
  );
  const resumeAt = useMemo(() => {
    const s = useZeroStore.getState().meta[videoId]?.seconds ?? 0;
    return s > 3 ? Math.floor(s) : undefined;
  }, [videoId]);
  const onEnded = useCallback(() => {
    setStatus(videoId, "watched");
    if (settings.autoplayNext && nextId) go(nextId);
  }, [go, nextId, setStatus, settings.autoplayNext, videoId]);

  const frame = useMemo(
    () => (
      <YtFrame
        videoId={videoId}
        onProgress={onProgress}
        onEnded={onEnded}
        autoplay={play}
        segments={settings.sponsorBlock ? segments : []}
        start={resumeAt}
      />
    ),
    [onEnded, onProgress, play, resumeAt, segments, settings.sponsorBlock, videoId],
  );

  useKeys(
    {
      j: () => go(nextId),
      J: () => go(nextId),
      ArrowDown: () => go(nextId),
      k: () => go(prevId),
      K: () => go(prevId),
      ArrowUp: () => go(prevId),
      e: () => {
        setStatus(videoId, "archived");
        toast("Cleared");
        void navigate({ to: "/inbox" });
      },
      l: () => {
        haptic("success");
        setBucket(videoId, "today");
        toast("Saved · Today");
      },
      w: () => {
        setStatus(videoId, "watched");
        toast("Marked watched");
      },
      s: () => {
        snoozeVideo(videoId, snoozeUntil("tonight"));
        toast("Hidden until tonight");
      },
      "1": () => setBucket(videoId, "today"),
      "2": () => setBucket(videoId, "tonight"),
      "3": () => setBucket(videoId, "tomorrow"),
      "4": () => setBucket(videoId, "weekend"),
      Escape: () => {
        if (help) setHelp(false);
        else if (window.history.length > 1) window.history.back();
        else void navigate({ to: "/inbox" });
      },
      "?": () => setHelp((v) => !v),
    },
    onboarded,
  );

  if (!onboarded) return <Onboarding />;

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <header className="flex items-center gap-1 px-2 py-1 pt-safe">
        <button
          type="button"
          className="flex h-11 items-center gap-0.5 px-2 text-accent"
          onClick={() => {
            if (window.history.length > 1) window.history.back();
            else void navigate({ to: "/inbox" });
          }}
        >
          <ChevronLeft className="size-6" />
          <span className="text-sm font-medium">Back</span>
        </button>
        <span className="ml-auto flex">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Share"
            onClick={() => {
              void shareVideo(title, videoId).then((r) => {
                if (r === "copied") toast("Link copied");
              });
            }}
          >
            <Share />
          </Button>
          <Button variant="ghost" size="icon-sm" asChild>
            <a
              href={`https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`}
              target="_blank"
              rel="noreferrer"
              aria-label="Open on YouTube"
            >
              <ExternalLink />
            </a>
          </Button>
        </span>
      </header>

      <div className="mx-auto max-w-5xl">
        <div className="aspect-video overflow-hidden bg-elevated sm:mx-4 sm:rounded-xl">
          {frame}
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 pb-16 pt-5 sm:px-6">
        <h1 className="text-xl font-semibold leading-snug tracking-tight sm:text-2xl">
          {title}
        </h1>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          {video ? (
            <Link
              to="/channel/$channelId"
              params={{ channelId: video.channelId }}
              className="flex items-center gap-3"
            >
              <ChannelAvatar title={video.channelTitle} src={channel?.thumbnail} />
              <span>
                <span className="block text-sm font-medium">{video.channelTitle}</span>
                <span className="block text-xs text-muted">Followed channel</span>
              </span>
            </Link>
          ) : (
            <p className="text-sm text-muted">Playing by video id</p>
          )}
          {segments.length > 0 && settings.sponsorBlock && (
            <span className="text-xs text-subtle">
              {segments.length} skip{segments.length === 1 ? "" : "s"} ready
            </span>
          )}
        </div>

        <form
          className="mt-5"
          onSubmit={(e) => {
            e.preventDefault();
            setNote(videoId, draft);
            toast(draft.trim() ? "Note saved" : "Note cleared");
          }}
        >
          <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-subtle">
            Note
          </label>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => {
              if (draft !== note) setNote(videoId, draft);
            }}
            rows={2}
            placeholder="Why you saved this, or what to skip to"
            className="w-full resize-none rounded-lg bg-elevated px-3 py-2.5 text-sm text-fg placeholder:text-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
          />
        </form>

        <p className="mb-2 mt-6 text-xs font-medium uppercase tracking-wide text-subtle">
          Save for
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {BUCKETS.map((b) => (
            <Button
              key={b.id}
              variant="secondary"
              className="h-auto flex-col items-start py-3"
              onClick={() => {
                haptic("success");
                setBucket(videoId, b.id);
                toast(`Saved · ${b.label}`);
              }}
            >
              <span>{b.label}</span>
              <span className="text-xs font-normal text-muted">{b.hint}</span>
            </Button>
          ))}
        </div>

        <p className="mb-2 mt-5 text-xs font-medium uppercase tracking-wide text-subtle">
          Snooze
        </p>
        <div className="grid grid-cols-3 gap-2">
          {SNOOZE_OPTIONS.map((s) => (
            <Button
              key={s.id}
              variant="secondary"
              size="sm"
              onClick={() => {
                snoozeVideo(videoId, snoozeUntil(s.id));
                toast(`Hidden until ${s.label.toLowerCase()}`);
              }}
            >
              {s.label}
            </Button>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setStatus(videoId, "archived");
              toast("Cleared");
              void navigate({ to: "/inbox" });
            }}
          >
            Clear
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStatus(videoId, "watched");
              toast("Marked watched");
            }}
          >
            Watched
          </Button>
          {video && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                muteChannel(video.channelId, muteUntil(7));
                toast(`Muted ${video.channelTitle} for a week`);
              }}
            >
              Mute channel
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => setHelp(true)}>
            Keys
          </Button>
        </div>

        {video?.description && (
          <p className="mt-6 max-w-2xl whitespace-pre-wrap text-sm leading-relaxed text-muted">
            {video.description.slice(0, 600)}
            {video.description.length > 600 ? "…" : ""}
          </p>
        )}

        {queue.length > 0 && (
          <section className="mt-10">
            <h2 className="text-sm font-semibold">Up next in your list</h2>
            <ul className="mt-3 overflow-hidden rounded-xl bg-surface">
              {queue.slice(0, 8).map((id, i, arr) => {
                const v = videos[id];
                if (!v) return null;
                return (
                  <li key={id}>
                    <Link
                      to="/watch/$videoId"
                      params={{ videoId: id }}
                      search={{ play: true }}
                      className={`flex gap-3 px-3 py-2.5 ${i === arr.length - 1 ? "" : "shadow-[inset_0_-0.5px_0_var(--color-border)]"}`}
                    >
                      <img
                        src={v.thumbnail}
                        alt=""
                        className="h-16 w-28 rounded-md object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <span className="min-w-0">
                        <span className="line-clamp-2 text-sm font-medium">
                          {displayTitle(v, allMeta[id], settings.dearrow)}
                        </span>
                        <span className="mt-1 block text-xs text-muted">
                          {v.channelTitle}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>

      {help && (
        <button
          type="button"
          className="fixed inset-0 z-50 grid place-items-end bg-bg/70 p-4 pb-safe sm:place-items-center"
          onClick={() => setHelp(false)}
        >
          <div className="w-full max-w-sm rounded-xl bg-surface p-5 text-left">
            <p className="text-base font-semibold">Keyboard</p>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li>J / K — next / previous</li>
              <li>L — save for today</li>
              <li>E — clear</li>
              <li>W — mark watched</li>
              <li>S — snooze tonight</li>
              <li>1–4 — today / tonight / tomorrow / weekend</li>
              <li>Esc — back</li>
            </ul>
          </div>
        </button>
      )}
    </div>
  );
}
