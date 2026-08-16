import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Chip, ChipRow, EmptyState, LargeTitle } from "@/components/ios";
import { Onboarding } from "@/components/onboarding";
import { Button } from "@/components/ui/button";
import { VideoFeed } from "@/components/video-feed";
import { useLaterCounts, useLaterVideos, useSnoozedVideos } from "@/lib/selectors";
import { useZeroStore } from "@/lib/store";
import { BUCKETS, type Bucket } from "@/lib/types";

export const Route = createFileRoute("/later")({ component: LaterPage });

function LaterPage() {
  const onboarded = useZeroStore((s) => s.onboarded);
  const [bucket, setBucket] = useState<Bucket | "all" | "snoozed">("all");
  const videos = useLaterVideos(bucket === "snoozed" ? "all" : bucket);
  const snoozed = useSnoozedVideos();
  const counts = useLaterCounts();
  const unsnooze = useZeroStore((s) => s.unsnoozeVideo);

  if (!onboarded) return <Onboarding />;

  const list = bucket === "snoozed" ? snoozed : videos;

  return (
    <AppShell>
      <LargeTitle title="Saved" subtitle="A queue with a time of day" />
      <ChipRow>
        <Chip active={bucket === "all"} onClick={() => setBucket("all")}>
          All
        </Chip>
        {BUCKETS.map((b) => (
          <Chip key={b.id} active={bucket === b.id} onClick={() => setBucket(b.id)}>
            {b.label}
            {counts[b.id] ? ` ${counts[b.id]}` : ""}
          </Chip>
        ))}
        <Chip active={bucket === "snoozed"} onClick={() => setBucket("snoozed")}>
          Snoozed{snoozed.length ? ` ${snoozed.length}` : ""}
        </Chip>
      </ChipRow>
      <div className="mt-4">
        {list.length === 0 ? (
          <EmptyState
            title={bucket === "snoozed" ? "Nothing snoozed" : "Nothing saved"}
            body={
              bucket === "snoozed"
                ? "Hide a video until tonight or the weekend. It stays out of the inbox until then."
                : "From any video, choose Today, Tonight, Tomorrow, or Weekend. It leaves the inbox until you are ready."
            }
          />
        ) : bucket === "snoozed" ? (
          <div className="flex flex-col gap-3">
            <Button
              variant="secondary"
              size="sm"
              className="self-start"
              onClick={() => {
                snoozed.forEach((v) => unsnooze(v.id));
                toast("All snoozes lifted");
              }}
            >
              Wake all
            </Button>
            <VideoFeed videos={list} />
          </div>
        ) : (
          <VideoFeed videos={list} swipe />
        )}
      </div>
    </AppShell>
  );
}
