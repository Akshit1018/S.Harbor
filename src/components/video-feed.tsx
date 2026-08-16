import { useEffect, useMemo } from "react";
import { toast } from "sonner";
import { SwipeRow } from "@/components/swipe-row";
import { VideoCard } from "@/components/video-card";
import { haptic } from "@/lib/haptics";
import { publishedMs, useZeroStore } from "@/lib/store";
import type { Video } from "@/lib/types";

const GROUP_ORDER = ["Today", "Yesterday", "This week", "Last week", "Earlier"] as const;

function startOfDay(now: number) {
  const d = new Date(now);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function recencyLabel(iso: string, now = Date.now()): (typeof GROUP_ORDER)[number] {
  const t = publishedMs(iso);
  const start = startOfDay(now);
  if (t >= start) return "Today";
  if (t >= start - 86_400_000) return "Yesterday";
  if (t >= start - 6 * 86_400_000) return "This week";
  if (t >= start - 13 * 86_400_000) return "Last week";
  return "Earlier";
}

function groupByRecency(videos: Video[]) {
  const map = new Map<string, Video[]>();
  for (const v of videos) {
    const label = recencyLabel(v.publishedAt);
    const arr = map.get(label);
    if (arr) arr.push(v);
    else map.set(label, [v]);
  }
  return GROUP_ORDER.filter((label) => map.has(label)).map((label) => ({
    label,
    items: map.get(label) ?? [],
  }));
}

export function VideoFeed({
  videos,
  swipe = false,
  focusedId,
  grouped = true,
}: {
  videos: Video[];
  swipe?: boolean;
  focusedId?: string;
  grouped?: boolean;
}) {
  const density = useZeroStore((s) => s.settings.density);
  const setLastList = useZeroStore((s) => s.setLastList);
  const setStatus = useZeroStore((s) => s.setStatus);
  const restore = useZeroStore((s) => s.restoreVideo);

  useEffect(() => {
    setLastList(videos.map((v) => v.id));
  }, [videos, setLastList]);

  const groups = useMemo(
    () => (grouped ? groupByRecency(videos) : [{ label: "", items: videos }]),
    [videos, grouped],
  );

  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => (
        <section key={group.label || "list"}>
          {group.label ? (
            <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-subtle">
              {group.label}
            </p>
          ) : null}
          <ul className="overflow-hidden rounded-xl bg-surface">
            {group.items.map((v, i) => {
              const card = (
                <VideoCard
                  video={v}
                  layout={density === "comfortable" ? "card" : "row"}
                  last={i === group.items.length - 1}
                  focused={focusedId === v.id}
                />
              );
              return (
                <li key={v.id}>
                  {swipe ? (
                    <SwipeRow
                      onLater={() => {
                        haptic("success");
                        setStatus(v.id, "later", "today");
                        toast("Saved for today", {
                          action: {
                            label: "Undo",
                            onClick: () => restore(v.id),
                          },
                        });
                      }}
                      onArchive={() => {
                        haptic("warning");
                        setStatus(v.id, "archived");
                        toast("Cleared", {
                          action: {
                            label: "Undo",
                            onClick: () => restore(v.id),
                          },
                        });
                      }}
                    >
                      {card}
                    </SwipeRow>
                  ) : (
                    card
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
