import { useLayoutEffect, useState } from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Bucket,
  Channel,
  Focus,
  Playlist,
  Settings,
  Video,
  VideoMeta,
  VideoStatus,
} from "./types";
import { DEFAULT_SETTINGS } from "./types";

type ZeroState = {
  onboarded: boolean;
  channels: Channel[];
  videos: Record<string, Video>;
  meta: Record<string, VideoMeta>;
  playlists: Playlist[];
  settings: Settings;
  lastFetchedAt: number;
  lastList: string[];
  query: string;
  pinnedIds: string[];
  lastOpenedAt: number;
  sessionOpenedAt: number;
  focus: Focus;
  mutedUntil: Record<string, number>;
  snoozedUntil: Record<string, number>;
  nowPlayingId: string | null;
  notes: Record<string, string>;
};

type ZeroActions = {
  markOnboarded: () => void;
  followChannel: (channel: Omit<Channel, "addedAt"> & { addedAt?: number }) => void;
  unfollowChannel: (channelId: string) => void;
  setChannelTags: (channelId: string, tags: string[]) => void;
  togglePin: (channelId: string) => void;
  upsertVideos: (videos: Video[]) => void;
  setStatus: (videoId: string, status: VideoStatus, bucket?: Bucket) => void;
  setBucket: (videoId: string, bucket: Bucket) => void;
  setProgress: (videoId: string, progress: number, seconds?: number) => void;
  toggleVideoTag: (videoId: string, tag: string) => void;
  toggleOriginalTitle: (videoId: string) => void;
  applyDearrow: (map: Record<string, string>) => void;
  addPlaylist: (name: string) => string;
  addToPlaylist: (playlistId: string, videoId: string) => void;
  removeFromPlaylist: (playlistId: string, videoId: string) => void;
  removePlaylist: (playlistId: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  setQuery: (q: string) => void;
  setLastList: (ids: string[]) => void;
  restoreVideo: (videoId: string) => void;
  restoreMany: (videoIds: string[]) => void;
  beginSession: () => void;
  setFocus: (focus: Focus) => void;
  muteChannel: (channelId: string, until: number) => void;
  unmuteChannel: (channelId: string) => void;
  snoozeVideo: (videoId: string, until: number) => void;
  unsnoozeVideo: (videoId: string) => void;
  setNowPlaying: (id: string | null) => void;
  setNote: (videoId: string, note: string) => void;
  markCaughtUp: (videoIds: string[]) => void;
};

export type ZeroStore = ZeroState & ZeroActions;

const emptyMeta = (): VideoMeta => ({
  status: "inbox",
  progress: 0,
  tags: [],
});

function withMeta(
  meta: Record<string, VideoMeta>,
  videoId: string,
  patch: Partial<VideoMeta>,
): Record<string, VideoMeta> {
  const prev = meta[videoId] ?? emptyMeta();
  return { ...meta, [videoId]: { ...prev, ...patch } };
}

export function publishedMs(iso: string | undefined): number {
  if (!iso) return 0;
  const n = Date.parse(iso);
  return Number.isFinite(n) ? n : 0;
}

export const useZeroStore = create<ZeroStore>()(
  persist(
    (set, get) => ({
      onboarded: false,
      channels: [],
      videos: {},
      meta: {},
      playlists: [],
      settings: DEFAULT_SETTINGS,
      lastFetchedAt: 0,
      lastList: [],
      query: "",
      pinnedIds: [],
      lastOpenedAt: 0,
      sessionOpenedAt: 0,
      focus: "all",
      mutedUntil: {},
      snoozedUntil: {},
      nowPlayingId: null,
      notes: {},

      markOnboarded: () => set({ onboarded: true }),

      followChannel: (channel) => {
        const existing = get().channels;
        if (existing.some((c) => c.id === channel.id)) return;
        set({
          channels: [
            ...existing,
            {
              ...channel,
              tags: channel.tags ?? [],
              addedAt: channel.addedAt ?? Date.now(),
            },
          ],
        });
      },

      unfollowChannel: (channelId) => {
        const videos = { ...get().videos };
        for (const id of Object.keys(videos)) {
          if (videos[id]?.channelId === channelId) delete videos[id];
        }
        const mutedUntil = { ...get().mutedUntil };
        delete mutedUntil[channelId];
        set({
          channels: get().channels.filter((c) => c.id !== channelId),
          videos,
          pinnedIds: get().pinnedIds.filter((id) => id !== channelId),
          mutedUntil,
        });
      },

      setChannelTags: (channelId, tags) =>
        set({
          channels: get().channels.map((c) =>
            c.id === channelId ? { ...c, tags } : c,
          ),
        }),

      togglePin: (channelId) => {
        const pinned = get().pinnedIds;
        set({
          pinnedIds: pinned.includes(channelId)
            ? pinned.filter((id) => id !== channelId)
            : [...pinned, channelId],
        });
      },

      upsertVideos: (incoming) => {
        const videos = { ...get().videos };
        for (const v of incoming) videos[v.id] = v;
        set({ videos, lastFetchedAt: Date.now() });
      },

      setStatus: (videoId, status, bucket) => {
        if (get().settings.incognito && (status === "watched" || status === "later")) {
          return;
        }
        const snoozedUntil = { ...get().snoozedUntil };
        delete snoozedUntil[videoId];
        set({
          snoozedUntil,
          meta: withMeta(get().meta, videoId, {
            status,
            bucket: status === "later" ? bucket : undefined,
            watchedAt: status === "watched" ? Date.now() : get().meta[videoId]?.watchedAt,
            progress:
              status === "watched"
                ? 1
                : (get().meta[videoId]?.progress ?? 0),
          }),
        });
      },

      setBucket: (videoId, bucket) => {
        if (get().settings.incognito) return;
        const snoozedUntil = { ...get().snoozedUntil };
        delete snoozedUntil[videoId];
        set({
          snoozedUntil,
          meta: withMeta(get().meta, videoId, {
            status: "later",
            bucket,
          }),
        });
      },

      setProgress: (videoId, progress, seconds) => {
        if (get().settings.incognito) return;
        const prev = get().meta[videoId] ?? emptyMeta();
        const watched = progress >= 0.9;
        set({
          meta: withMeta(get().meta, videoId, {
            progress,
            seconds: typeof seconds === "number" ? seconds : prev.seconds,
            status: watched ? "watched" : prev.status === "inbox" ? "inbox" : prev.status,
            watchedAt: watched ? Date.now() : prev.watchedAt,
          }),
        });
      },

      toggleVideoTag: (videoId, tag) => {
        const prev = get().meta[videoId] ?? emptyMeta();
        const has = prev.tags.includes(tag);
        const tags = has ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag];
        set({ meta: withMeta(get().meta, videoId, { tags }) });
      },

      toggleOriginalTitle: (videoId) => {
        const prev = get().meta[videoId] ?? emptyMeta();
        set({
          meta: withMeta(get().meta, videoId, { useOriginal: !prev.useOriginal }),
        });
      },

      applyDearrow: (map) => {
        const meta = { ...get().meta };
        for (const [id, title] of Object.entries(map)) {
          const prev = meta[id] ?? emptyMeta();
          meta[id] = { ...prev, dearrowTitle: title };
        }
        set({ meta });
      },

      addPlaylist: (name) => {
        const id = crypto.randomUUID();
        set({
          playlists: [
            ...get().playlists,
            { id, name: name.trim() || "Untitled", videoIds: [], createdAt: Date.now() },
          ],
        });
        return id;
      },

      addToPlaylist: (playlistId, videoId) =>
        set({
          playlists: get().playlists.map((p) =>
            p.id === playlistId && !p.videoIds.includes(videoId)
              ? { ...p, videoIds: [...p.videoIds, videoId] }
              : p,
          ),
        }),

      removeFromPlaylist: (playlistId, videoId) =>
        set({
          playlists: get().playlists.map((p) =>
            p.id === playlistId
              ? { ...p, videoIds: p.videoIds.filter((id) => id !== videoId) }
              : p,
          ),
        }),

      removePlaylist: (playlistId) =>
        set({ playlists: get().playlists.filter((p) => p.id !== playlistId) }),

      updateSettings: (patch) =>
        set({ settings: { ...get().settings, ...patch } }),

      setQuery: (query) => set({ query }),
      setLastList: (lastList) => set({ lastList }),
      restoreVideo: (videoId) => {
        const snoozedUntil = { ...get().snoozedUntil };
        delete snoozedUntil[videoId];
        set({
          snoozedUntil,
          meta: withMeta(get().meta, videoId, {
            status: "inbox",
            bucket: undefined,
          }),
        });
      },
      restoreMany: (videoIds) => {
        let meta = get().meta;
        const snoozedUntil = { ...get().snoozedUntil };
        for (const id of videoIds) {
          meta = withMeta(meta, id, { status: "inbox", bucket: undefined });
          delete snoozedUntil[id];
        }
        set({ meta, snoozedUntil });
      },
      beginSession: () => {
        const prev = get().lastOpenedAt;
        const autoEvening = get().settings.autoEvening;
        const hour = new Date().getHours();
        const evening = hour >= 20 || hour < 5;
        set({
          sessionOpenedAt: prev || Date.now(),
          lastOpenedAt: Date.now(),
          focus: autoEvening ? (evening ? "evening" : "all") : get().focus,
        });
      },
      setFocus: (focus) => set({ focus }),
      muteChannel: (channelId, until) =>
        set({ mutedUntil: { ...get().mutedUntil, [channelId]: until } }),
      unmuteChannel: (channelId) => {
        const mutedUntil = { ...get().mutedUntil };
        delete mutedUntil[channelId];
        set({ mutedUntil });
      },
      snoozeVideo: (videoId, until) =>
        set({ snoozedUntil: { ...get().snoozedUntil, [videoId]: until } }),
      unsnoozeVideo: (videoId) => {
        const snoozedUntil = { ...get().snoozedUntil };
        delete snoozedUntil[videoId];
        set({ snoozedUntil });
      },
      setNowPlaying: (nowPlayingId) => set({ nowPlayingId }),
      setNote: (videoId, note) => {
        const notes = { ...get().notes };
        const next = note.trim();
        if (next) notes[videoId] = next;
        else delete notes[videoId];
        set({ notes });
      },
      markCaughtUp: (videoIds) => {
        let meta = get().meta;
        const snoozedUntil = { ...get().snoozedUntil };
        for (const id of videoIds) {
          meta = withMeta(meta, id, { status: "archived" });
          delete snoozedUntil[id];
        }
        set({ meta, snoozedUntil });
      },
    }),
    {
      name: "harbor-v1",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<ZeroState>;
        return {
          ...current,
          ...p,
          settings: { ...current.settings, ...(p.settings ?? {}) },
          mutedUntil: p.mutedUntil ?? {},
          snoozedUntil: p.snoozedUntil ?? {},
          pinnedIds: p.pinnedIds ?? [],
          notes: p.notes ?? {},
        };
      },
      partialize: (state) => ({
        onboarded: state.onboarded,
        channels: state.channels,
        videos: state.videos,
        meta: state.meta,
        playlists: state.playlists,
        settings: state.settings,
        lastFetchedAt: state.lastFetchedAt,
        pinnedIds: state.pinnedIds,
        lastOpenedAt: state.lastOpenedAt,
        focus: state.focus,
        mutedUntil: state.mutedUntil,
        snoozedUntil: state.snoozedUntil,
        nowPlayingId: state.nowPlayingId,
        notes: state.notes,
      }),
    },
  ),
);

if (typeof window !== "undefined") {
  void useZeroStore.persist.rehydrate();
}

export function useHasHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useLayoutEffect(() => {
    if (useZeroStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    return useZeroStore.persist.onFinishHydration(() => setHydrated(true));
  }, []);
  return hydrated;
}

export function displayTitle(video: Video, meta?: VideoMeta, dearrowOn = true) {
  const community = meta?.dearrowTitle?.trim();
  if (dearrowOn && community && !meta?.useOriginal) return community;
  return video.title;
}

type FeedSlice = Pick<ZeroState, "videos" | "meta">;
type InboxSlice = FeedSlice &
  Pick<ZeroState, "settings" | "query" | "focus" | "mutedUntil" | "snoozedUntil">;

function isHiddenByQuiet(
  mutedUntil: Record<string, number>,
  snoozedUntil: Record<string, number>,
  video: Video,
  now: number,
): boolean {
  const muted = mutedUntil[video.channelId];
  if (muted && muted > now) return true;
  const snooze = snoozedUntil[video.id];
  if (snooze && snooze > now) return true;
  return false;
}

function byNewest(a: Video, b: Video) {
  return publishedMs(b.publishedAt) - publishedMs(a.publishedAt);
}

export function selectInbox(state: InboxSlice): Video[] {
  const q = state.query.trim().toLowerCase();
  const hideShorts =
    state.settings.hideShortsInInbox || state.focus === "evening";
  const now = Date.now();
  return Object.values(state.videos)
    .filter((v) => {
      const m = state.meta[v.id];
      if (m?.status === "archived" || m?.status === "later") return false;
      if (
        state.settings.hideWatched &&
        (m?.status === "watched" || (m?.progress ?? 0) >= 0.9)
      ) {
        return false;
      }
      if (hideShorts && v.isShort) return false;
      if (isHiddenByQuiet(state.mutedUntil, state.snoozedUntil, v, now)) return false;
      if (q) {
        const hay = `${v.title} ${v.channelTitle}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    })
    .sort(byNewest);
}

export function selectContinue(state: FeedSlice): Video[] {
  return Object.values(state.videos)
    .filter((v) => {
      const m = state.meta[v.id];
      if (!m) return false;
      if (m.status === "archived") return false;
      return m.progress > 0.05 && m.progress < 0.9;
    })
    .sort((a, b) => (state.meta[b.id]?.watchedAt ?? 0) - (state.meta[a.id]?.watchedAt ?? 0));
}

export function selectFresh(state: FeedSlice & { sessionOpenedAt: number } & Pick<ZeroState, "mutedUntil" | "snoozedUntil">): Video[] {
  if (!state.sessionOpenedAt) return [];
  const now = Date.now();
  return Object.values(state.videos)
    .filter((v) => {
      const m = state.meta[v.id];
      if (m?.status === "archived" || m?.status === "later" || m?.status === "watched") {
        return false;
      }
      if (isHiddenByQuiet(state.mutedUntil, state.snoozedUntil, v, now)) return false;
      return publishedMs(v.publishedAt) > state.sessionOpenedAt;
    })
    .sort(byNewest);
}

export function selectLater(state: FeedSlice, bucket?: Bucket): Video[] {
  return Object.values(state.videos)
    .filter((v) => {
      const m = state.meta[v.id];
      if (m?.status !== "later") return false;
      if (bucket && m.bucket !== bucket) return false;
      return true;
    })
    .sort(byNewest);
}

export function selectSnoozed(
  state: FeedSlice & Pick<ZeroState, "snoozedUntil">,
): Video[] {
  const now = Date.now();
  return Object.values(state.videos)
    .filter((v) => (state.snoozedUntil[v.id] ?? 0) > now)
    .sort((a, b) => (state.snoozedUntil[a.id] ?? 0) - (state.snoozedUntil[b.id] ?? 0));
}

export function selectArchived(state: FeedSlice): Video[] {
  return Object.values(state.videos)
    .filter((v) => state.meta[v.id]?.status === "archived")
    .sort(byNewest);
}

export function selectHistory(state: FeedSlice): Video[] {
  return Object.values(state.videos)
    .filter((v) => {
      const m = state.meta[v.id];
      return m?.status === "watched" || (m?.progress ?? 0) > 0.05;
    })
    .sort(
      (a, b) =>
        (state.meta[b.id]?.watchedAt ?? 0) - (state.meta[a.id]?.watchedAt ?? 0),
    );
}

export function selectShorts(
  state: FeedSlice & Pick<ZeroState, "mutedUntil">,
): Video[] {
  const now = Date.now();
  return Object.values(state.videos)
    .filter((v) => {
      if (!v.isShort) return false;
      const m = state.meta[v.id];
      if (m?.status === "archived") return false;
      const muted = state.mutedUntil[v.channelId];
      if (muted && muted > now) return false;
      return true;
    })
    .sort(byNewest);
}

export function selectChannelVideos(state: Pick<ZeroState, "videos">, channelId: string): Video[] {
  return Object.values(state.videos)
    .filter((v) => v.channelId === channelId)
    .sort(byNewest);
}
