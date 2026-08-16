import { useNavigate } from "@tanstack/react-router";
import { MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { relativeTime, shareVideo, viewsLabel } from "@/lib/format";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/cn";
import { muteUntil, SNOOZE_OPTIONS, snoozeUntil } from "@/lib/schedule";
import { displayTitle, useZeroStore } from "@/lib/store";
import { BUCKETS, type Bucket, type Video } from "@/lib/types";

export function VideoCard({
  video,
  layout = "row",
  last = false,
  focused = false,
}: {
  video: Video;
  layout?: "card" | "row";
  last?: boolean;
  focused?: boolean;
}) {
  const meta = useZeroStore((s) => s.meta[video.id]);
  const settings = useZeroStore((s) => s.settings);
  const note = useZeroStore((s) => s.notes[video.id]);
  const setStatus = useZeroStore((s) => s.setStatus);
  const [menu, setMenu] = useState(false);
  const navigate = useNavigate();
  const title = displayTitle(video, meta, settings.dearrow);
  const progress = meta?.progress ?? 0;

  return (
    <>
      <article
        id={`video-${video.id}`}
        role="link"
        tabIndex={0}
        onClick={() =>
          void navigate({ to: "/watch/$videoId", params: { videoId: video.id } })
        }
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            void navigate({ to: "/watch/$videoId", params: { videoId: video.id } });
          }
        }}
        className={cn(
          "group relative cursor-pointer bg-surface",
          focused && "bg-fill",
          layout === "row"
            ? cn("flex gap-3 px-3 py-2.5", !last && "shadow-[inset_0_-0.5px_0_var(--color-border)]")
            : "flex flex-col gap-2 p-3",
        )}
      >
        <div
          className={cn(
            "relative shrink-0 overflow-hidden bg-elevated",
            layout === "row" ? "h-16 w-28 rounded-md" : "aspect-video w-full rounded-lg",
          )}
        >
          <img
            src={video.thumbnail}
            alt=""
            className="size-full object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={(e) => {
              const el = e.currentTarget;
              if (!el.src.includes("hqdefault")) {
                el.src = `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`;
              }
            }}
          />
          {video.isShort && (
            <span className="absolute left-1.5 top-1.5 rounded bg-bg/80 px-1.5 py-px text-2xs font-medium">
              Short
            </span>
          )}
          {progress > 0.04 && (
            <span className="absolute inset-x-0 bottom-0 h-0.5 bg-fill">
              <span
                className="block h-full bg-accent"
                style={{ width: `${Math.min(100, progress * 100)}%` }}
              />
            </span>
          )}
        </div>
        <div className="relative z-10 flex min-w-0 flex-1 gap-2">
          <div className="min-w-0 flex-1">
            <p className="block text-sm font-medium leading-snug text-fg">
              {title}
            </p>
            <p className="mt-1 truncate text-xs text-muted">
              {video.channelTitle}
              <span className="mx-1 text-subtle">·</span>
              {relativeTime(video.publishedAt)}
              {video.views > 0 && (
                <>
                  <span className="mx-1 text-subtle">·</span>
                  {viewsLabel(video.views)}
                </>
              )}
            </p>
            {note && (
              <p className="mt-1 truncate text-xs text-accent">{note}</p>
            )}
          </div>
          <Button
            variant="plain"
            size="icon-sm"
            className="relative z-20 size-9 shrink-0 text-subtle"
            aria-label="More"
            onClick={(e) => {
              e.stopPropagation();
              setMenu(true);
            }}
          >
            <MoreHorizontal />
          </Button>
        </div>
      </article>
      <VideoActions
        video={video}
        open={menu}
        onOpenChange={setMenu}
        onLater={(b) => setStatus(video.id, "later", b)}
      />
    </>
  );
}

function VideoActions({
  video,
  open,
  onOpenChange,
  onLater,
}: {
  video: Video;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onLater: (b: Bucket) => void;
}) {
  const setStatus = useZeroStore((s) => s.setStatus);
  const restore = useZeroStore((s) => s.restoreVideo);
  const playlists = useZeroStore((s) => s.playlists);
  const addToPlaylist = useZeroStore((s) => s.addToPlaylist);
  const addPlaylist = useZeroStore((s) => s.addPlaylist);
  const toggleOriginal = useZeroStore((s) => s.toggleOriginalTitle);
  const snoozeVideo = useZeroStore((s) => s.snoozeVideo);
  const muteChannel = useZeroStore((s) => s.muteChannel);
  const setNote = useZeroStore((s) => s.setNote);
  const note = useZeroStore((s) => s.notes[video.id] ?? "");
  const meta = useZeroStore((s) => s.meta[video.id]);
  const [draft, setDraft] = useState(note);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="flex flex-col gap-4 overflow-y-auto px-5 pb-6 pt-4">
          <div>
            <DrawerTitle className="line-clamp-2 text-base font-semibold leading-snug">
              {video.title}
            </DrawerTitle>
            <DrawerDescription className="mt-1 text-sm text-muted">
              {video.channelTitle}
            </DrawerDescription>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-subtle">
              Save for
            </p>
            <div className="grid grid-cols-2 gap-2">
              {BUCKETS.map((b) => (
                <Button
                  key={b.id}
                  variant="secondary"
                  className="h-auto flex-col items-start py-3"
                  onClick={() => {
                    haptic("success");
                    onLater(b.id);
                    toast(`Saved · ${b.label}`);
                    onOpenChange(false);
                  }}
                >
                  <span>{b.label}</span>
                  <span className="text-xs font-normal text-muted">{b.hint}</span>
                </Button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-subtle">
              Snooze
            </p>
            <div className="grid grid-cols-3 gap-2">
              {SNOOZE_OPTIONS.map((s) => (
                <Button
                  key={s.id}
                  variant="secondary"
                  className="h-auto flex-col py-2.5"
                  onClick={() => {
                    haptic("light");
                    snoozeVideo(video.id, snoozeUntil(s.id));
                    toast(`Hidden until ${s.label.toLowerCase()}`, {
                      action: {
                        label: "Undo",
                        onClick: () => restore(video.id),
                      },
                    });
                    onOpenChange(false);
                  }}
                >
                  <span>{s.label}</span>
                </Button>
              ))}
            </div>
          </div>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              setNote(video.id, draft);
              toast(draft.trim() ? "Note saved" : "Note cleared");
            }}
          >
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Note for later"
              onFocus={() => setDraft(note)}
            />
            <Button type="submit" variant="secondary">
              Save
            </Button>
          </form>
          <div className="overflow-hidden rounded-xl bg-elevated">
            <Action
              label="Mark watched"
              onClick={() => {
                setStatus(video.id, "watched");
                toast("Marked watched");
                onOpenChange(false);
              }}
            />
            <Action
              label="Restore to inbox"
              onClick={() => {
                restore(video.id);
                toast("Back in inbox");
                onOpenChange(false);
              }}
            />
            <Action
              label="Share link"
              onClick={() => {
                void shareVideo(video.title, video.id).then((r) => {
                  if (r === "copied") toast("Link copied");
                });
                onOpenChange(false);
              }}
            />
            <Action
              label="Mute channel for 7 days"
              onClick={() => {
                muteChannel(video.channelId, muteUntil(7));
                toast(`Muted ${video.channelTitle} for a week`);
                onOpenChange(false);
              }}
            />
            <Action
              label="Clear from pile"
              danger
              last={!meta?.dearrowTitle && playlists.length === 0}
              onClick={() => {
                setStatus(video.id, "archived");
                toast("Cleared", {
                  action: { label: "Undo", onClick: () => restore(video.id) },
                });
                onOpenChange(false);
              }}
            />
            {meta?.dearrowTitle && (
              <Action
                last={playlists.length === 0}
                label={meta.useOriginal ? "Use community title" : "Show original title"}
                onClick={() => {
                  toggleOriginal(video.id);
                  onOpenChange(false);
                }}
              />
            )}
            {playlists.length === 0 ? (
              <Action
                last
                label="New collection"
                onClick={() => {
                  const id = addPlaylist("Later pile");
                  addToPlaylist(id, video.id);
                  toast("Added to Later pile");
                  onOpenChange(false);
                }}
              />
            ) : (
              playlists.map((p, i) => (
                <Action
                  key={p.id}
                  last={i === playlists.length - 1}
                  label={`Add to ${p.name}`}
                  onClick={() => {
                    addToPlaylist(p.id, video.id);
                    toast(`Added to ${p.name}`);
                    onOpenChange(false);
                  }}
                />
              ))
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function Action({
  label,
  onClick,
  danger,
  last,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  last?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-11 w-full items-center px-4 text-left text-sm",
        danger ? "text-live" : "text-fg",
        !last && "shadow-[inset_0_-0.5px_0_var(--color-border)]",
      )}
    >
      {label}
    </button>
  );
}
