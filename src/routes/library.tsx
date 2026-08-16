import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { EmptyState, LargeTitle, Segmented } from "@/components/ios";
import { Onboarding } from "@/components/onboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VideoFeed } from "@/components/video-feed";
import { useArchivedVideos, useHistoryVideos } from "@/lib/selectors";
import { useZeroStore } from "@/lib/store";

export const Route = createFileRoute("/library")({ component: LibraryPage });

type Tab = "history" | "cleared" | "collections";

function LibraryPage() {
  const onboarded = useZeroStore((s) => s.onboarded);
  const [tab, setTab] = useState<Tab>("history");
  const history = useHistoryVideos();
  const archived = useArchivedVideos();
  const playlists = useZeroStore((s) => s.playlists);
  const videos = useZeroStore((s) => s.videos);
  const addPlaylist = useZeroStore((s) => s.addPlaylist);
  const removePlaylist = useZeroStore((s) => s.removePlaylist);
  const restore = useZeroStore((s) => s.restoreVideo);
  const [name, setName] = useState("");

  if (!onboarded) return <Onboarding />;

  return (
    <AppShell>
      <LargeTitle title="Library" subtitle="History, cleared, collections" />
      <Segmented<Tab>
        value={tab}
        onChange={setTab}
        options={[
          { id: "history", label: "History" },
          { id: "cleared", label: "Cleared" },
          { id: "collections", label: "Collections" },
        ]}
      />
      <div className="mt-4">
        {tab === "history" &&
          (history.length === 0 ? (
            <EmptyState
              title="No history yet"
              body="Playback progress stays on this device. Incognito pauses writing."
            />
          ) : (
            <VideoFeed videos={history} />
          ))}

        {tab === "cleared" &&
          (archived.length === 0 ? (
            <EmptyState
              title="Nothing cleared"
              body="Reject videos you will not watch. They leave the inbox and wait here if you change your mind."
            />
          ) : (
            <div className="flex flex-col gap-4">
              <Button
                variant="secondary"
                size="sm"
                className="self-start"
                onClick={() => archived.forEach((v) => restore(v.id))}
              >
                Restore all
              </Button>
              <VideoFeed videos={archived} />
            </div>
          ))}

        {tab === "collections" && (
          <div className="flex flex-col gap-6">
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!name.trim()) return;
                addPlaylist(name);
                setName("");
              }}
            >
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="New collection"
              />
              <Button type="submit">Create</Button>
            </form>
            {playlists.length === 0 ? (
              <EmptyState
                title="No collections"
                body="Local lists only — they never leave this device or become a recommendation engine."
              />
            ) : (
              <ul className="flex flex-col gap-5">
                {playlists.map((p) => {
                  const items = p.videoIds
                    .map((id) => videos[id])
                    .filter((v): v is NonNullable<typeof v> => Boolean(v));
                  return (
                    <li key={p.id}>
                      <div className="mb-2 flex items-center justify-between gap-3 px-1">
                        <div>
                          <h2 className="text-sm font-semibold">{p.name}</h2>
                          <p className="text-xs text-muted">
                            {items.length} video{items.length === 1 ? "" : "s"}
                          </p>
                        </div>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => removePlaylist(p.id)}
                        >
                          Delete
                        </Button>
                      </div>
                      {items.length > 0 && <VideoFeed videos={items} />}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
