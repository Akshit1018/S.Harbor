import { createServerFn } from "@tanstack/react-start";
import { decodeHtml } from "./format";
import type { LiveStream, Video } from "./types";

type ResolvedChannel = {
  id: string;
  title: string;
  handle?: string;
  thumbnail: string;
};

type CacheEntry<T> = { at: number; value: T };

const globalCache = globalThis as typeof globalThis & {
  __zeroFeedCache__?: Map<string, CacheEntry<Video[]>>;
  __zeroChannelCache__?: Map<string, CacheEntry<ResolvedChannel>>;
};

function feedCache() {
  return (globalCache.__zeroFeedCache__ ??= new Map());
}
function channelCache() {
  return (globalCache.__zeroChannelCache__ ??= new Map());
}

const FEED_TTL = 15 * 60 * 1000;
const CHANNEL_TTL = 60 * 60 * 1000;
const FETCH_MS = 4500;

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";


async function fetchText(url: string, timeoutMs = FETCH_MS): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      Accept: "application/atom+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`Fetch failed ${res.status}`);
  return res.text();
}

function tagContent(xml: string, name: string): string {
  const re = new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i");
  const m = xml.match(re);
  return m ? decodeHtml(m[1].trim()) : "";
}

function attr(xml: string, name: string): string {
  const re = new RegExp(`${name}="([^"]*)"`, "i");
  const m = xml.match(re);
  return m ? m[1] : "";
}

function parseFeed(xml: string): Video[] {
  const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/gi)].map(
    (m) => m[1] ?? "",
  );
  const videos: Video[] = [];
  for (const entry of entries) {
    const id = tagContent(entry, "yt:videoId");
    if (!id) continue;
    const link = attr(entry.match(/<link[^>]*>/i)?.[0] ?? "", "href");
    const viewsRaw = attr(
      entry.match(/<media:statistics[^>]*>/i)?.[0] ?? "",
      "views",
    );
    videos.push({
      id,
      channelId: tagContent(entry, "yt:channelId") || "",
      channelTitle: tagContent(entry, "name") || tagContent(entry, "author"),
      title: tagContent(entry, "title"),
      publishedAt: tagContent(entry, "published"),
      thumbnail: `https://i.ytimg.com/vi/${id}/hq720.jpg`,
      description: tagContent(entry, "media:description"),
      views: Number(viewsRaw) || 0,
      isShort: link.includes("/shorts/"),
    });
  }
  return videos;
}

async function readFeed(url: string, channelId: string): Promise<Video[]> {
  const xml = await fetchText(url);
  if (!xml.includes("<entry")) throw new Error("Empty feed");
  const videos = parseFeed(xml).map((v) => ({
    ...v,
    channelId: v.channelId || channelId,
  }));
  if (!videos.length) throw new Error("Empty feed");
  return videos;
}

async function loadFeed(channelId: string): Promise<Video[]> {
  const cached = feedCache().get(channelId);
  if (cached && Date.now() - cached.at < FEED_TTL) return cached.value;
  const urls = [
    `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`,
    `https://inv.nadeko.net/feed/channel/${encodeURIComponent(channelId)}`,
  ];
  try {
    const videos = await Promise.any(urls.map((url) => readFeed(url, channelId)));
    feedCache().set(channelId, { at: Date.now(), value: videos });
    return videos;
  } catch {
    throw new Error("Feed unavailable");
  }
}

function extractChannel(html: string, fallbackQuery: string): ResolvedChannel {
  const canonical =
    html.match(
      /<link rel="canonical" href="https?:\/\/www\.youtube\.com\/channel\/(UC[\w-]{22})"/i,
    )?.[1] ??
    html.match(/https:\/\/www\.youtube\.com\/channel\/(UC[\w-]{22})/)?.[1];
  const id = canonical;
  if (!id) throw new Error(`Could not find a channel for “${fallbackQuery}”`);
  const title =
    html.match(/<meta property="og:title" content="([^"]+)"/i)?.[1] ??
    fallbackQuery;
  const thumbnail =
    html.match(/<meta property="og:image" content="([^"]+)"/i)?.[1] ?? "";
  const handle =
    html.match(/youtube\.com\/@([\w.-]+)/i)?.[1] ??
    (fallbackQuery.startsWith("@") ? fallbackQuery.slice(1) : undefined);
  return {
    id,
    title: decodeHtml(title.replace(/\s+/g, " ").trim()),
    handle,
    thumbnail,
  };
}

export const resolveChannel = createServerFn({ method: "POST" })
  .validator((query: string) => query.trim())
  .handler(async ({ data: query }) => {
    if (!query) throw new Error("Enter a channel @handle or URL");
    const cacheKey = query.toLowerCase();
    const cached = channelCache().get(cacheKey);
    if (cached && Date.now() - cached.at < CHANNEL_TTL) return cached.value;

    const idMatch = query.match(/(UC[\w-]{22})/);
    const handleMatch = query.match(/@([\w.-]+)/);
    let url: string;
    if (idMatch) url = `https://www.youtube.com/channel/${idMatch[1]}`;
    else if (handleMatch) url = `https://www.youtube.com/@${handleMatch[1]}`;
    else if (/^[\w.-]+$/.test(query)) url = `https://www.youtube.com/@${query}`;
    else throw new Error("Use an @handle, channel URL, or channel ID");

    const html = await fetchText(url, 8000);
    const resolved = extractChannel(html, query);
    channelCache().set(cacheKey, { at: Date.now(), value: resolved });
    return resolved;
  });

export const fetchOneFeed = createServerFn({ method: "POST" })
  .validator((channelId: string) => channelId.trim())
  .handler(async ({ data: channelId }) => {
    if (!channelId) return [];
    return loadFeed(channelId);
  });

export const fetchFeeds = createServerFn({ method: "POST" })
  .validator((d: { channelIds: string[] }) => d)
  .handler(async ({ data }) => {
    const ids = [...new Set(data.channelIds.filter(Boolean))].slice(0, 40);
    const out: Video[] = [];
    let failures = 0;
    const queue = [...ids];
    const workers = Array.from({ length: Math.min(6, queue.length) }, async () => {
      while (queue.length) {
        const id = queue.shift();
        if (!id) break;
        try {
          out.push(...(await loadFeed(id)));
        } catch {
          failures += 1;
        }
      }
    });
    await Promise.all(workers);
    if (ids.length > 0 && out.length === 0 && failures === ids.length) {
      throw new Error("Could not reach channel feeds");
    }
    return out;
  });

export const fetchDearrowTitles = createServerFn({ method: "POST" })
  .validator((d: { videoIds: string[] }) => d)
  .handler(async ({ data }) => {
    const ids = data.videoIds.slice(0, 12);
    const map: Record<string, string> = {};
    await Promise.all(
      ids.map(async (id) => {
        try {
          const res = await fetch(
            `https://sponsor.ajay.app/api/branding?videoID=${encodeURIComponent(id)}`,
            { signal: AbortSignal.timeout(2500) },
          );
          if (!res.ok) return;
          const json = (await res.json()) as {
            titles?: { title?: string; votes?: number }[];
          };
          const best = [...(json.titles ?? [])]
            .filter((t) => t.title)
            .sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0))[0];
          if (best?.title) map[id] = best.title;
        } catch {
          /* optional */
        }
      }),
    );
    return map;
  });

export const checkLive = createServerFn({ method: "POST" })
  .validator((d: { channels: { id: string; handle?: string }[] }) => d)
  .handler(async ({ data }) => {
    const list = data.channels.slice(0, 6);
    const found: LiveStream[] = [];
    await Promise.all(
      list.map(async (ch) => {
        const url = ch.handle
          ? `https://www.youtube.com/@${ch.handle}/live`
          : `https://www.youtube.com/channel/${ch.id}/live`;
        try {
          const res = await fetch(url, {
            headers: { "User-Agent": UA },
            redirect: "follow",
            signal: AbortSignal.timeout(4000),
          });
          const html = await res.text();
          const live =
            /"isLiveNow"\s*:\s*true/.test(html) ||
            /"isLive":true/.test(html) ||
            /watching now/i.test(html);
          if (!live) return;
          const videoId =
            res.url.match(/[?&]v=([\w-]{11})/)?.[1] ??
            html.match(/"videoId":"([\w-]{11})"/)?.[1];
          if (!videoId) return;
          const title =
            html
              .match(/<title>([^<]+)<\/title>/)?.[1]
              ?.replace(/\s+- YouTube$/, "")
              ?.trim() ?? "Live";
          found.push({
            channelId: ch.id,
            videoId,
            title: decodeHtml(title),
          });
        } catch {
          /* skip */
        }
      }),
    );
    return found;
  });

export const fetchSkipSegments = createServerFn({ method: "POST" })
  .validator((d: { videoId: string }) => d)
  .handler(async ({ data }) => {
    try {
      const cats = encodeURIComponent(
        JSON.stringify(["sponsor", "selfpromo", "intro", "outro", "interaction"]),
      );
      const res = await fetch(
        `https://sponsor.ajay.app/api/skipSegments?videoID=${encodeURIComponent(data.videoId)}&categories=${cats}`,
        { signal: AbortSignal.timeout(4000) },
      );
      if (!res.ok) return [];
      const json = (await res.json()) as {
        category?: string;
        segment?: [number, number];
      }[];
      return json
        .filter((row) => Array.isArray(row.segment) && row.segment.length === 2)
        .map((row) => ({
          category: row.category ?? "sponsor",
          start: Number(row.segment![0]),
          end: Number(row.segment![1]),
        }))
        .filter((s) => s.end > s.start);
    } catch {
      return [];
    }
  });
