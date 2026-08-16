import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ChannelAvatar } from "@/components/channel-avatar";
import { EmptyState, LargeTitle } from "@/components/ios";
import { Button } from "@/components/ui/button";
import { Onboarding } from "@/components/onboarding";
import { useZeroStore } from "@/lib/store";
import type { LiveStream } from "@/lib/types";
import { checkLive } from "@/lib/youtube";

export const Route = createFileRoute("/live")({ component: LivePage });

function LivePage() {
  const onboarded = useZeroStore((s) => s.onboarded);
  const channels = useZeroStore((s) => s.channels);
  const [live, setLive] = useState<LiveStream[] | null>(null);
  const [busy, setBusy] = useState(false);

  async function scan() {
    if (!channels.length) {
      setLive([]);
      return;
    }
    setBusy(true);
    try {
      const found = await checkLive({
        data: {
          channels: channels.map((c) => ({ id: c.id, handle: c.handle })),
        },
      });
      setLive(found);
    } catch {
      setLive([]);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void scan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channels.map((c) => c.id).join(",")]);

  if (!onboarded) return <Onboarding />;

  return (
    <AppShell>
      <LargeTitle
        title="Live"
        subtitle="Only streams from channels you follow"
        action={
          <Button variant="ghost" size="sm" onClick={() => void scan()} disabled={busy}>
            {busy ? "Checking" : "Refresh"}
          </Button>
        }
      />
      {busy && live === null ? (
        <p className="text-sm text-muted">Looking for live streams…</p>
      ) : !live?.length ? (
        <EmptyState
          title="Nobody is live"
          body="When a followed channel goes live, it will appear here. Upcoming premieres stay out of the main inbox."
        />
      ) : (
        <ul className="overflow-hidden rounded-xl bg-surface">
          {live.map((item, i) => {
            const ch = channels.find((c) => c.id === item.channelId);
            return (
              <li key={item.videoId}>
                <Link
                  to="/watch/$videoId"
                  params={{ videoId: item.videoId }}
                  className={
                    i === live.length - 1
                      ? "flex gap-3 px-3 py-3"
                      : "flex gap-3 px-3 py-3 shadow-[inset_0_-0.5px_0_var(--color-border)]"
                  }
                >
                  <div className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-md bg-elevated">
                    <img
                      src={`https://i.ytimg.com/vi/${item.videoId}/hq720.jpg`}
                      alt=""
                      className="size-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute left-1.5 top-1.5 rounded-full bg-live px-2 py-px text-2xs font-semibold text-live-fg">
                      LIVE
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-snug">{item.title}</p>
                    <p className="mt-2 flex items-center gap-2 text-xs text-muted">
                      <ChannelAvatar
                        title={ch?.title ?? "Channel"}
                        src={ch?.thumbnail}
                        size="sm"
                      />
                      {ch?.title}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}
