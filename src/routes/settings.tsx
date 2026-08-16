import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { SignedIn, SignedOut, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { AppShell } from "@/components/app-shell";
import { Group, LargeTitle } from "@/components/ios";
import { Onboarding } from "@/components/onboarding";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { downloadText, exportOpml, parseOpml } from "@/lib/opml";
import { useZeroStore } from "@/lib/store";
import { resolveChannel } from "@/lib/youtube";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

function SettingsPage() {
  const onboarded = useZeroStore((s) => s.onboarded);
  const settings = useZeroStore((s) => s.settings);
  const update = useZeroStore((s) => s.updateSettings);
  const channels = useZeroStore((s) => s.channels);
  const follow = useZeroStore((s) => s.followChannel);
  const mutedUntil = useZeroStore((s) => s.mutedUntil);
  const unmute = useZeroStore((s) => s.unmuteChannel);
  const { user, isPending } = useCurrentUserState();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const muted = channels.filter((c) => (mutedUntil[c.id] ?? 0) > Date.now());

  async function onImport(file: File) {
    setImporting(true);
    try {
      const xml = await file.text();
      const rows = parseOpml(xml);
      if (!rows.length) {
        toast.error("No YouTube channels in that file");
        return;
      }
      let added = 0;
      for (const row of rows.slice(0, 40)) {
        try {
          const ch = await resolveChannel({ data: row.id });
          follow({ ...ch, tags: [] });
          added += 1;
        } catch {
          follow({
            id: row.id,
            title: row.title,
            thumbnail: "",
            tags: [],
          });
          added += 1;
        }
      }
      toast.success(`Imported ${added} channel${added === 1 ? "" : "s"}`);
    } catch {
      toast.error("Could not read that file");
    } finally {
      setImporting(false);
    }
  }

  if (!onboarded) return <Onboarding />;

  return (
    <AppShell>
      <LargeTitle title="Settings" subtitle="Rules for this iPhone" />

      <Group header="Inbox">
        <Toggle
          label="Hide watched"
          hint="Keep the pile to things you have not finished"
          checked={settings.hideWatched}
          onChange={(v) => update({ hideWatched: v })}
        />
        <Toggle
          label="Keep shorts out of inbox"
          hint="They still appear on Shorts"
          checked={settings.hideShortsInInbox}
          onChange={(v) => update({ hideShortsInInbox: v })}
        />
        <Toggle
          label="Community titles"
          hint="Replace clickbait when a better title exists"
          checked={settings.dearrow}
          onChange={(v) => update({ dearrow: v })}
        />
        <Toggle
          last
          label="Compact rows"
          hint="Podcasts-style list"
          checked={settings.density === "compact"}
          onChange={(v) => update({ density: v ? "compact" : "comfortable" })}
        />
      </Group>

      <Group header="Focus">
        <Toggle
          label="Evening after 8"
          hint="Automatically hide shorts after 8pm"
          checked={settings.autoEvening}
          onChange={(v) => update({ autoEvening: v })}
        />
        <Toggle
          last
          label="Haptics"
          hint="Light tap on swipe and catch up"
          checked={settings.haptics}
          onChange={(v) => update({ haptics: v })}
        />
      </Group>

      <Group header="Playback">
        <Toggle
          label="Play next in your list"
          hint="Never a recommendation — only what you already queued"
          checked={settings.autoplayNext}
          onChange={(v) => update({ autoplayNext: v })}
        />
        <Toggle
          label="Skip sponsors"
          hint="Jump past community-marked intros, ads, and outros"
          checked={settings.sponsorBlock}
          onChange={(v) => update({ sponsorBlock: v })}
        />
        <Toggle
          last
          label="Incognito"
          hint="Do not write history or Pulse for this tab"
          checked={settings.incognito}
          onChange={(v) => update({ incognito: v })}
        />
      </Group>

      {muted.length > 0 && (
        <Group header="Muted channels" footer="Muted channels stay followed. Their uploads pause.">
          {muted.map((c, i) => (
            <div
              key={c.id}
              className={
                i === muted.length - 1
                  ? "flex items-center justify-between gap-3 px-4 py-3"
                  : "flex items-center justify-between gap-3 px-4 py-3 shadow-[inset_0_-0.5px_0_var(--color-border)]"
              }
            >
              <span className="min-w-0 truncate text-sm">{c.title}</span>
              <button
                type="button"
                className="text-sm font-medium text-accent"
                onClick={() => unmute(c.id)}
              >
                Unmute
              </button>
            </div>
          ))}
        </Group>
      )}

      <Group
        header="Subscriptions"
        footer="OPML is the same file YouTube Takeout uses. Harbor never talks to Google as you."
      >
        <button
          type="button"
          className="flex min-h-11 w-full items-center px-4 text-left text-sm text-accent shadow-[inset_0_-0.5px_0_var(--color-border)]"
          onClick={() =>
            downloadText("harbor.opml", exportOpml(channels), "text/xml")
          }
        >
          Export OPML
        </button>
        <button
          type="button"
          className="flex min-h-11 w-full items-center px-4 text-left text-sm text-accent"
          onClick={() => fileRef.current?.click()}
        >
          {importing ? "Importing…" : "Import OPML"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".opml,.xml,text/xml"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void onImport(file);
            e.target.value = "";
          }}
        />
      </Group>

      <Group header="Account" footer="Sign-in is optional. Subscriptions stay on this device.">
        <div className="px-4 py-3">
          {isPending ? (
            <div className="h-10 w-40 animate-pulse rounded-md bg-elevated" />
          ) : (
            <>
              <SignedIn>
                <UserButton />
                {user?.primaryEmail && (
                  <p className="mt-1 text-xs text-subtle">{user.primaryEmail}</p>
                )}
              </SignedIn>
              <SignedOut>
                <Button asChild variant="ghost" className="px-0">
                  <Link to="/login">Sign in</Link>
                </Button>
              </SignedOut>
            </>
          )}
        </div>
      </Group>

      <Group
        header="Keyboard"
        footer="Works on Inbox and Watch. Slash focuses search. J and K move like Mail."
      >
        <KeyRow combo="J / K" label="Next / previous" />
        <KeyRow combo="Enter" label="Open" />
        <KeyRow combo="L" label="Save for today" />
        <KeyRow combo="E" label="Clear" />
        <KeyRow combo="S" label="Snooze tonight" />
        <KeyRow combo="C" label="Catch up" last />
      </Group>

      <Group header="About">
        <p className="px-4 py-3 text-sm leading-relaxed text-muted">
          Harbor is a subscription reader. It fetches public RSS from channels you
          follow. No Google account. No API key. No home feed.
        </p>
      </Group>
    </AppShell>
  );
}

function KeyRow({
  combo,
  label,
  last,
}: {
  combo: string;
  label: string;
  last?: boolean;
}) {
  return (
    <div
      className={
        last
          ? "flex items-center justify-between gap-3 px-4 py-3"
          : "flex items-center justify-between gap-3 px-4 py-3 shadow-[inset_0_-0.5px_0_var(--color-border)]"
      }
    >
      <span className="text-sm">{label}</span>
      <span className="text-xs tabular-nums text-subtle">{combo}</span>
    </div>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
  last,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  last?: boolean;
}) {
  return (
    <div
      className={
        last
          ? "flex items-center justify-between gap-3 px-4 py-3"
          : "flex items-center justify-between gap-3 px-4 py-3 shadow-[inset_0_-0.5px_0_var(--color-border)]"
      }
    >
      <label className="min-w-0">
        <span className="block text-sm">{label}</span>
        <span className="block text-xs text-muted">{hint}</span>
      </label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
