import type { Bucket, Video } from "./types";

export function isEveningHour(date = new Date()): boolean {
  const h = date.getHours();
  return h >= 20 || h < 5;
}

export function currentLaterBucket(date = new Date()): Bucket {
  const day = date.getDay();
  if (day === 0 || day === 6) return "weekend";
  if (isEveningHour(date)) return "tonight";
  return "today";
}

export type SnoozeKind = "tonight" | "tomorrow" | "weekend";

export const SNOOZE_OPTIONS: { id: SnoozeKind; label: string; hint: string }[] = [
  { id: "tonight", label: "Tonight", hint: "After 8" },
  { id: "tomorrow", label: "Tomorrow", hint: "8 in the morning" },
  { id: "weekend", label: "Weekend", hint: "Saturday morning" },
];

export function snoozeUntil(kind: SnoozeKind, from = new Date()): number {
  const d = new Date(from);
  if (kind === "tonight") {
    d.setHours(20, 0, 0, 0);
    if (d.getTime() <= from.getTime()) d.setDate(d.getDate() + 1);
    return d.getTime();
  }
  if (kind === "tomorrow") {
    d.setDate(d.getDate() + 1);
    d.setHours(8, 0, 0, 0);
    return d.getTime();
  }
  const day = d.getDay();
  const add = day === 6 ? 7 : 6 - day;
  d.setDate(d.getDate() + add);
  d.setHours(9, 0, 0, 0);
  return d.getTime();
}

export function muteUntil(days: number, from = Date.now()): number {
  return from + days * 86_400_000;
}

export function estimateMinutes(videos: Pick<Video, "isShort">[]): number {
  return videos.reduce((n, v) => n + (v.isShort ? 1 : 12), 0);
}

export function formatMinutes(n: number): string {
  if (n < 1) return "a moment";
  if (n < 60) return `about ${n} min`;
  const h = Math.floor(n / 60);
  const m = n % 60;
  return m ? `about ${h} h ${m} min` : `about ${h} h`;
}
