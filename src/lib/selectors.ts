import { useMemo } from "react";
import {
  selectArchived,
  selectChannelVideos,
  selectContinue,
  selectFresh,
  selectHistory,
  selectInbox,
  selectLater,
  selectShorts,
  selectSnoozed,
  useZeroStore,
} from "./store";
import type { Bucket, Video } from "./types";

export function useInboxVideos(): Video[] {
  const videos = useZeroStore((s) => s.videos);
  const meta = useZeroStore((s) => s.meta);
  const settings = useZeroStore((s) => s.settings);
  const query = useZeroStore((s) => s.query);
  const focus = useZeroStore((s) => s.focus);
  const mutedUntil = useZeroStore((s) => s.mutedUntil);
  const snoozedUntil = useZeroStore((s) => s.snoozedUntil);
  return useMemo(
    () =>
      selectInbox({
        videos,
        meta,
        settings,
        query,
        focus,
        mutedUntil,
        snoozedUntil,
      }),
    [videos, meta, settings, query, focus, mutedUntil, snoozedUntil],
  );
}

export function useInboxVideosUnfiltered(): Video[] {
  const videos = useZeroStore((s) => s.videos);
  const meta = useZeroStore((s) => s.meta);
  const settings = useZeroStore((s) => s.settings);
  const mutedUntil = useZeroStore((s) => s.mutedUntil);
  const snoozedUntil = useZeroStore((s) => s.snoozedUntil);
  return useMemo(
    () =>
      selectInbox({
        videos,
        meta,
        settings,
        query: "",
        focus: "all",
        mutedUntil,
        snoozedUntil,
      }),
    [videos, meta, settings, mutedUntil, snoozedUntil],
  );
}

export function useInboxCount(): number {
  return useInboxVideos().length;
}

export function useContinueVideos(): Video[] {
  const videos = useZeroStore((s) => s.videos);
  const meta = useZeroStore((s) => s.meta);
  return useMemo(() => selectContinue({ videos, meta }), [videos, meta]);
}

export function useFreshVideos(): Video[] {
  const videos = useZeroStore((s) => s.videos);
  const meta = useZeroStore((s) => s.meta);
  const sessionOpenedAt = useZeroStore((s) => s.sessionOpenedAt);
  const mutedUntil = useZeroStore((s) => s.mutedUntil);
  const snoozedUntil = useZeroStore((s) => s.snoozedUntil);
  return useMemo(
    () => selectFresh({ videos, meta, sessionOpenedAt, mutedUntil, snoozedUntil }),
    [videos, meta, sessionOpenedAt, mutedUntil, snoozedUntil],
  );
}

export function useLaterVideos(bucket?: Bucket | "all"): Video[] {
  const videos = useZeroStore((s) => s.videos);
  const meta = useZeroStore((s) => s.meta);
  return useMemo(() => {
    const slice = { videos, meta };
    return bucket && bucket !== "all" ? selectLater(slice, bucket) : selectLater(slice);
  }, [videos, meta, bucket]);
}

export function useSnoozedVideos(): Video[] {
  const videos = useZeroStore((s) => s.videos);
  const meta = useZeroStore((s) => s.meta);
  const snoozedUntil = useZeroStore((s) => s.snoozedUntil);
  return useMemo(
    () => selectSnoozed({ videos, meta, snoozedUntil }),
    [videos, meta, snoozedUntil],
  );
}

export function useHistoryVideos(): Video[] {
  const videos = useZeroStore((s) => s.videos);
  const meta = useZeroStore((s) => s.meta);
  return useMemo(() => selectHistory({ videos, meta }), [videos, meta]);
}

export function useArchivedVideos(): Video[] {
  const videos = useZeroStore((s) => s.videos);
  const meta = useZeroStore((s) => s.meta);
  return useMemo(() => selectArchived({ videos, meta }), [videos, meta]);
}

export function useShortsVideos(): Video[] {
  const videos = useZeroStore((s) => s.videos);
  const meta = useZeroStore((s) => s.meta);
  const mutedUntil = useZeroStore((s) => s.mutedUntil);
  return useMemo(
    () => selectShorts({ videos, meta, mutedUntil }),
    [videos, meta, mutedUntil],
  );
}

export function useChannelVideos(channelId: string): Video[] {
  const videos = useZeroStore((s) => s.videos);
  return useMemo(
    () => selectChannelVideos({ videos }, channelId),
    [videos, channelId],
  );
}

export function useFollowedIds(): string[] {
  const channels = useZeroStore((s) => s.channels);
  return useMemo(() => channels.map((c) => c.id), [channels]);
}

export function useLaterCounts(): Record<Bucket, number> {
  const videos = useZeroStore((s) => s.videos);
  const meta = useZeroStore((s) => s.meta);
  return useMemo(() => {
    const slice = { videos, meta };
    return {
      today: selectLater(slice, "today").length,
      tonight: selectLater(slice, "tonight").length,
      tomorrow: selectLater(slice, "tomorrow").length,
      weekend: selectLater(slice, "weekend").length,
    };
  }, [videos, meta]);
}
