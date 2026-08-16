import { createFileRoute, Link } from "@tanstack/react-router";
import { AddChannelButton } from "@/components/add-channel";
import { AppShell } from "@/components/app-shell";
import { ChannelAvatar } from "@/components/channel-avatar";
import { EmptyState, Group, LargeTitle } from "@/components/ios";
import { Onboarding } from "@/components/onboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useZeroStore } from "@/lib/store";

export const Route = createFileRoute("/channels")({ component: ChannelsPage });

function ChannelsPage() {
  const onboarded = useZeroStore((s) => s.onboarded);
  const channels = useZeroStore((s) => s.channels);
  const unfollow = useZeroStore((s) => s.unfollowChannel);
  const setChannelTags = useZeroStore((s) => s.setChannelTags);
  const togglePin = useZeroStore((s) => s.togglePin);
  const pinnedIds = useZeroStore((s) => s.pinnedIds);
  const mutedUntil = useZeroStore((s) => s.mutedUntil);
  const unmute = useZeroStore((s) => s.unmuteChannel);

  if (!onboarded) return <Onboarding />;

  const sorted = channels.slice().sort((a, b) => a.title.localeCompare(b.title));

  return (
    <AppShell>
      <LargeTitle
        title="Channels"
        subtitle={`${channels.length} followed · public RSS`}
        action={<AddChannelButton />}
      />
      {channels.length === 0 ? (
        <EmptyState
          title="Follow someone"
          body="Add an @handle. Every new upload lands in the inbox. Nothing is recommended."
          action={<AddChannelButton />}
        />
      ) : (
        <Group>
          {sorted.map((c, i) => {
            const muted = (mutedUntil[c.id] ?? 0) > Date.now();
            return (
              <div
                key={c.id}
                className={
                  i === sorted.length - 1
                    ? "flex flex-col gap-3 px-4 py-3"
                    : "flex flex-col gap-3 px-4 py-3 shadow-[inset_0_-0.5px_0_var(--color-border)]"
                }
              >
                <div className="flex items-center gap-3">
                  <Link
                    to="/channel/$channelId"
                    params={{ channelId: c.id }}
                    className="flex min-w-0 flex-1 items-center gap-3"
                  >
                    <ChannelAvatar title={c.title} src={c.thumbnail} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{c.title}</span>
                      <span className="block text-xs text-muted">
                        {c.handle ? `@${c.handle}` : muted ? "Muted" : "Channel"}
                      </span>
                    </span>
                  </Link>
                  <button
                    type="button"
                    className="h-11 px-2 text-xs font-medium text-accent"
                    onClick={() => togglePin(c.id)}
                  >
                    {pinnedIds.includes(c.id) ? "Unpin" : "Pin"}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    className="h-9"
                    placeholder="Tags, comma separated"
                    defaultValue={c.tags.join(", ")}
                    onBlur={(e) =>
                      setChannelTags(
                        c.id,
                        e.target.value
                          .split(",")
                          .map((t) => t.trim())
                          .filter(Boolean),
                      )
                    }
                  />
                  {muted && (
                    <Button variant="ghost" size="sm" onClick={() => unmute(c.id)}>
                      Unmute
                    </Button>
                  )}
                  <Button variant="danger" size="sm" onClick={() => unfollow(c.id)}>
                    Unfollow
                  </Button>
                </div>
              </div>
            );
          })}
        </Group>
      )}
    </AppShell>
  );
}
