import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Archive,
  BarChart3,
  ChevronRight,
  History,
  ListMusic,
  Radio,
  Settings,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { AddChannelButton } from "@/components/add-channel";
import { ChannelAvatar } from "@/components/channel-avatar";
import { Group, LargeTitle } from "@/components/ios";
import { Onboarding } from "@/components/onboarding";
import { useHistoryVideos, useInboxCount } from "@/lib/selectors";
import { useZeroStore } from "@/lib/store";

export const Route = createFileRoute("/you")({ component: YouPage });

function YouPage() {
  const onboarded = useZeroStore((s) => s.onboarded);
  const channels = useZeroStore((s) => s.channels);
  const playlists = useZeroStore((s) => s.playlists);
  const inbox = useInboxCount();
  const history = useHistoryVideos();
  const togglePin = useZeroStore((s) => s.togglePin);
  const pinnedIds = useZeroStore((s) => s.pinnedIds);
  const mutedUntil = useZeroStore((s) => s.mutedUntil);

  if (!onboarded) return <Onboarding />;

  return (
    <AppShell>
      <LargeTitle
        title="You"
        subtitle="This device only"
        action={<AddChannelButton />}
      />

      <Group header="Library">
        <LinkRow to="/library" icon={History} label="History" hint={`${history.length}`} />
        <LinkRow to="/later" icon={ListMusic} label="Saved" hint="Tonight, weekend" />
        <LinkRow to="/library" icon={Archive} label="Cleared" />
        <LinkRow to="/live" icon={Radio} label="Live" last />
      </Group>

      {playlists.length > 0 && (
        <Group header="Collections">
          {playlists.map((p, i) => (
            <LinkRow
              key={p.id}
              to="/library"
              icon={ListMusic}
              label={p.name}
              hint={`${p.videoIds.length}`}
              last={i === playlists.length - 1}
            />
          ))}
        </Group>
      )}

      <Group header="Following" footer="Pin a channel to keep it on Today.">
        <LinkRow
          to="/channels"
          icon={Users}
          label="Manage channels"
          hint={`${channels.length}`}
          last={channels.length === 0}
        />
        {channels.slice(0, 8).map((c, i) => {
          const muted = (mutedUntil[c.id] ?? 0) > Date.now();
          return (
            <div
              key={c.id}
              className={
                i === Math.min(channels.length, 8) - 1
                  ? "flex items-center gap-3 px-4 py-2"
                  : "flex items-center gap-3 px-4 py-2 shadow-[inset_0_-0.5px_0_var(--color-border)]"
              }
            >
              <Link
                to="/channel/$channelId"
                params={{ channelId: c.id }}
                className="flex min-w-0 flex-1 items-center gap-3"
              >
                <ChannelAvatar title={c.title} src={c.thumbnail} size="sm" />
                <span className="min-w-0">
                  <span className="block truncate text-sm">{c.title}</span>
                  {muted && <span className="text-xs text-subtle">Muted</span>}
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
          );
        })}
      </Group>

      <Group header="Insights">
        <LinkRow to="/pulse" icon={BarChart3} label="Pulse" hint="Local only" last />
      </Group>

      <Group header="Harbor">
        <LinkRow to="/settings" icon={Settings} label="Settings" last />
      </Group>

      <p className="px-4 text-center text-xs text-subtle">
        {inbox} waiting · {playlists.length} collections
      </p>
    </AppShell>
  );
}

function LinkRow({
  to,
  icon: Icon,
  label,
  hint,
  last,
}: {
  to: string;
  icon: typeof Settings;
  label: string;
  hint?: string;
  last?: boolean;
}) {
  return (
    <Link
      to={to}
      className={
        last
          ? "flex min-h-11 items-center gap-3 px-4 py-2"
          : "flex min-h-11 items-center gap-3 px-4 py-2 shadow-[inset_0_-0.5px_0_var(--color-border)]"
      }
    >
      <span className="grid size-7 place-items-center rounded-md bg-elevated text-accent">
        <Icon className="size-4" />
      </span>
      <span className="flex-1 text-sm">{label}</span>
      {hint && <span className="text-xs text-subtle">{hint}</span>}
      <ChevronRight className="size-4 text-subtle" />
    </Link>
  );
}
