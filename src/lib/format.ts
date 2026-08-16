import { formatDistanceToNowStrict } from "date-fns";

export function relativeTime(iso: string): string {
  try {
    return formatDistanceToNowStrict(new Date(iso), { addSuffix: true });
  } catch {
    return "";
  }
}

export function compactNumber(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "";
  if (n < 1000) return String(n);
  if (n < 10_000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  if (n < 1_000_000) return `${Math.round(n / 1000)}K`;
  if (n < 10_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  return `${Math.round(n / 1_000_000)}M`;
}

export function viewsLabel(n: number): string {
  const v = compactNumber(n);
  return v ? `${v} views` : "";
}

export function decodeHtml(s: string): string {
  return s
    .replace(/\u0026amp;/g, "\u0026")
    .replace(/\u0026lt;/g, "<")
    .replace(/\u0026gt;/g, ">")
    .replace(/\u0026quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\u0026apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n: string) =>
      String.fromCharCode(parseInt(n, 16)),
    );
}


export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "·";
}

export function thumbUrl(videoId: string, quality: "hq" | "hq720" = "hq720") {
  return quality === "hq720"
    ? `https://i.ytimg.com/vi/${videoId}/hq720.jpg`
    : `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

export function youtubeWatchUrl(videoId: string) {
  return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
}

export async function shareVideo(title: string, videoId: string) {
  const url = youtubeWatchUrl(videoId);
  try {
    if (navigator.share) {
      await navigator.share({ title, url });
      return "shared" as const;
    }
    await navigator.clipboard.writeText(url);
    return "copied" as const;
  } catch {
    return "cancelled" as const;
  }
}
