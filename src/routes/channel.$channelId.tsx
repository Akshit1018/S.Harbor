import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { ChannelAvatar } from "@/components/channel-avatar";
import { EmptyState, LargeTitle } from "@/components/ios";
import { Onboarding } from "@/components/onboarding";
import { Button } from "@/components/ui/button";
import { VideoFeed } from "@/components/video-feed";
import { muteUntil } from "@/lib/schedule";
import { useChannelVideos } from "@/lib/selectors";
import { useZeroStore } from "@/lib/store";
import { useFeedSync } from "@/lib/use-feed";

export const Route = createFileRoute("/channel/$channelId")({
  component: ChannelPage,
});

function ChannelPage() {
  const { channelId } = Route.useParams();
  const onboarded = useZeroStore((s) => s.onboarded);
  const channels = useZeroStore((s) => s.channels);
  const channel = channels.find((c) => c.id === channelId);
  const videos = useChannelVideos(channelId);
  const unfollow = useZeroStore((s) => s.unfollowChannel);
  const togglePin = useZeroStore((s) => s.togglePin);
  const pinnedIds = useZeroStore((s) => s.pinnedIds);
  const muteChannel = useZeroStore((s) => s.muteChannel);
  const unmute = useZeroStore((s) => s.unmuteChannel);
  const muted = (useZeroStore((s) => s.mutedUntil[channelId]) ?? 0) > Date.now();
  useFeedSync();

  if (!onboarded) return <Onboarding />;

  return (
    <AppShell>
      <LargeTitle
        title={channel?.title ?? "Channel"}
        subtitle={channel?.handle ? `@${channel.handle}` : "Recent uploads"}
      />
      {channel && (
        <div className="mb-6 flex items-center gap-3">
          <ChannelAvatar title={channel.title} src={channel.thumbnail} size="lg" />
          <div className="min-w-0 flex-1">
            {channel.tags.length > 0 && (
              <p className="text-sm text-muted">{channel.tags.join(" · ")}</p>
            )}
            <div className="mt-2 flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={() => togglePin(channel.id)}>
                {pinnedIds.includes(channel.id) ? "Unpin" : "Pin"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  muted ? unmute(channel.id) : muteChannel(channel.id, muteUntil(7))
                }
              >
                {muted ? "Unmute" : "Mute 7 days"}
              </Button>
              <Button variant="danger" size="sm" onClick={() => unfollow(channel.id)}>
                Unfollow
              </Button>
            </div>
          </div>
        </div>
      )}
      {!channel && (
        <Button variant="secondary" size="sm" className="mb-6" asChild>
          <Link to="/channels">Channels</Link>
        </Button>
      )}
      {videos.length === 0 ? (
        <EmptyState
          title="No videos cached yet"
          body="Refresh the inbox to pull this channel’s public RSS feed."
        />
      ) : (
        <VideoFeed videos={videos} swipe />
      )}
    </AppShell>
  );
}
