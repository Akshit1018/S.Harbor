import { useCallback, useEffect, useState } from "react";
import { publishedMs, useZeroStore } from "./store";
import { fetchDearrowTitles, fetchOneFeed } from "./youtube";

const STALE_MS = 3 * 60 * 1000;
const POOL = 6;
let inflight = false;

async function mapPool<T>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<void>,
) {
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i;
      i += 1;
      const item = items[idx];
      if (item !== undefined) await fn(item);
    }
  });
  await Promise.all(workers);
}

export function useFeedSync() {
  const channels = useZeroStore((s) => s.channels);
  const upsertVideos = useZeroStore((s) => s.upsertVideos);
  const applyDearrow = useZeroStore((s) => s.applyDearrow);
  const dearrow = useZeroStore((s) => s.settings.dearrow);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const channelKey = channels.map((c) => c.id).join(",");

  const refresh = useCallback(
    async (force = false) => {
      const ids = channelKey.split(",").filter(Boolean);
      if (!ids.length) return;
      if (inflight && !force) return;

      const state = useZeroStore.getState();
      const have = new Set(Object.values(state.videos).map((v) => v.channelId));
      const missing = ids.filter((id) => !have.has(id));
      const stale = Date.now() - state.lastFetchedAt >= STALE_MS;
      if (!force && !stale && missing.length === 0) return;

      const targets = force || stale ? ids : missing;
      inflight = true;
      setStatus("loading");
      let ok = 0;
      let fail = 0;

      try {
        await mapPool(targets, POOL, async (id) => {
          try {
            const videos = await fetchOneFeed({ data: id });
            if (videos.length) {
              upsertVideos(videos);
              ok += 1;
            } else {
              fail += 1;
            }
          } catch {
            fail += 1;
          }
        });

        if (ok === 0 && fail === targets.length) {
          setStatus("error");
          return;
        }

        setStatus("idle");

        if (dearrow) {
          const latest = Object.values(useZeroStore.getState().videos)
            .sort((a, b) => publishedMs(b.publishedAt) - publishedMs(a.publishedAt))
            .slice(0, 12)
            .map((v) => v.id);
          void fetchDearrowTitles({ data: { videoIds: latest } })
            .then(applyDearrow)
            .catch(() => undefined);
        }
      } catch {
        setStatus("error");
      } finally {
        inflight = false;
      }
    },
    [channelKey, upsertVideos, applyDearrow, dearrow],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { refresh, status };
}
