export type Bucket = "today" | "tonight" | "tomorrow" | "weekend";

export type VideoStatus = "inbox" | "later" | "archived" | "watched";

export type Density = "comfortable" | "compact";

export type Focus = "all" | "fresh" | "evening";

export type Channel = {
  id: string;
  title: string;
  handle?: string;
  thumbnail: string;
  tags: string[];
  addedAt: number;
};

export type Video = {
  id: string;
  channelId: string;
  channelTitle: string;
  title: string;
  publishedAt: string;
  thumbnail: string;
  description: string;
  views: number;
  isShort: boolean;
};

export type VideoMeta = {
  status: VideoStatus;
  bucket?: Bucket;
  progress: number;
  seconds?: number;
  watchedAt?: number;
  tags: string[];
  dearrowTitle?: string;
  useOriginal?: boolean;
};

export type Playlist = {
  id: string;
  name: string;
  videoIds: string[];
  createdAt: number;
};

export type Settings = {
  hideWatched: boolean;
  hideShortsInInbox: boolean;
  dearrow: boolean;
  incognito: boolean;
  density: Density;
  autoplayNext: boolean;
  haptics: boolean;
  autoEvening: boolean;
  sponsorBlock: boolean;
};

export type LiveStream = {
  channelId: string;
  videoId: string;
  title: string;
};

export const BUCKETS: { id: Bucket; label: string; hint: string }[] = [
  { id: "today", label: "Today", hint: "Before evening" },
  { id: "tonight", label: "Tonight", hint: "After dinner" },
  { id: "tomorrow", label: "Tomorrow", hint: "Next daylight" },
  { id: "weekend", label: "Weekend", hint: "When it is quiet" },
];

export const DEFAULT_SETTINGS: Settings = {
  hideWatched: true,
  hideShortsInInbox: true,
  dearrow: true,
  incognito: false,
  density: "compact",
  autoplayNext: false,
  haptics: true,
  autoEvening: true,
  sponsorBlock: true,
};

export function greetingFor(date = new Date()): string {
  const h = date.getHours();
  if (h < 5) return "Still up";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Tonight";
}
