import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/app-shell";
import { EmptyState, Group, LargeTitle } from "@/components/ios";
import { Onboarding } from "@/components/onboarding";
import { useHistoryVideos } from "@/lib/selectors";
import { estimateMinutes, formatMinutes } from "@/lib/schedule";
import { useZeroStore } from "@/lib/store";

export const Route = createFileRoute("/pulse")({ component: PulsePage });

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function PulsePage() {
  const onboarded = useZeroStore((s) => s.onboarded);
  const history = useHistoryVideos();
  const meta = useZeroStore((s) => s.meta);
  const videos = useZeroStore((s) => s.videos);
  const channels = useZeroStore((s) => s.channels);
  const archived = Object.values(meta).filter((m) => m.status === "archived").length;
  const later = Object.values(meta).filter((m) => m.status === "later").length;

  const weekAgo = Date.now() - WEEK_MS;
  const week = history.filter((v) => (meta[v.id]?.watchedAt ?? 0) >= weekAgo);
  const weekCleared = Object.values(meta).filter(
    (m) => m.status === "archived" && (m.watchedAt ?? 0) >= weekAgo,
  ).length;
  const weekMinutes = estimateMinutes(week);
  const weekTop = Object.values(
    week.reduce<Record<string, { name: string; count: number }>>((acc, v) => {
      acc[v.channelId] ??= { name: v.channelTitle, count: 0 };
      acc[v.channelId].count += 1;
      return acc;
    }, {}),
  ).sort((a, b) => b.count - a.count)[0];

  const byChannel = Object.values(
    history.reduce<Record<string, { name: string; count: number }>>((acc, v) => {
      const key = v.channelId;
      acc[key] ??= { name: v.channelTitle, count: 0 };
      acc[key].count += 1;
      return acc;
    }, {}),
  )
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const byHour = Array.from({ length: 24 }, (_, hour) => {
    const count = Object.values(meta).filter((m) => {
      if (!m.watchedAt) return false;
      return new Date(m.watchedAt).getHours() === hour;
    }).length;
    return { hour: String(hour).padStart(2, "0"), count };
  });

  const peak = [...byHour].sort((a, b) => b.count - a.count)[0];

  if (!onboarded) return <Onboarding />;

  return (
    <AppShell>
      <LargeTitle title="Pulse" subtitle="Local viewing patterns. Nothing is sent anywhere." />
      {history.length === 0 ? (
        <EmptyState
          title="No pulse yet"
          body="Watch a few videos. Counts stay on this device — hours, channels, and how you triage."
        />
      ) : (
        <>
          <section className="mb-7 rounded-xl bg-surface px-4 py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-subtle">
              This week
            </p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">
              {week.length === 0
                ? "A quiet week"
                : `${week.length} watched · ${formatMinutes(weekMinutes)}`}
            </p>
            <p className="mt-2 text-sm text-muted">
              {weekTop
                ? `Mostly ${weekTop.name}. ${weekCleared} cleared.`
                : "Nothing finished yet. The inbox is still the point."}
              {peak && peak.count > 0
                ? ` You usually watch around ${peak.hour}:00.`
                : ""}
            </p>
          </section>

          <div className="mb-7 grid grid-cols-2 gap-3">
            <Stat label="Watched" value={history.length} />
            <Stat label="Following" value={channels.length} />
            <Stat label="Scheduled" value={later} />
            <Stat label="Cleared" value={archived} />
          </div>
          <section className="mb-7 overflow-hidden rounded-xl bg-surface p-4">
            <h2 className="text-sm font-semibold">Hours you actually watch</h2>
            <div className="mt-4 h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byHour}>
                  <XAxis
                    dataKey="hour"
                    tick={{ fill: "rgba(235,235,245,0.36)", fontSize: 10 }}
                    interval={3}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide />
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,0.04)" }}
                    contentStyle={{
                      background: "#1c1c1e",
                      border: "1px solid rgba(84,84,88,0.65)",
                      borderRadius: 10,
                      color: "#f5f5f7",
                    }}
                  />
                  <Bar dataKey="count" fill="#0a84ff" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
          <Group header="Channels you return to">
            {byChannel.map((c, i) => (
              <div
                key={c.name}
                className={
                  i === byChannel.length - 1
                    ? "flex items-center justify-between px-4 py-3 text-sm"
                    : "flex items-center justify-between px-4 py-3 text-sm shadow-[inset_0_-0.5px_0_var(--color-border)]"
                }
              >
                <span className="truncate">{c.name}</span>
                <span className="tabular-nums text-muted">{c.count}</span>
              </div>
            ))}
          </Group>
          <p className="px-4 text-xs text-subtle">
            {Object.keys(videos).length} videos cached from public RSS feeds.
          </p>
        </>
      )}
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-surface px-4 py-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight">{value}</p>
    </div>
  );
}
