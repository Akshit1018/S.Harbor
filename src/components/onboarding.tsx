import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ChannelAvatar } from "@/components/channel-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CATALOG, CATALOG_CATEGORIES } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import { useZeroStore } from "@/lib/store";
import { resolveChannel } from "@/lib/youtube";

export function Onboarding() {
  const [step, setStep] = useState<0 | 1>(0);
  const follow = useZeroStore((s) => s.followChannel);
  const unfollow = useZeroStore((s) => s.unfollowChannel);
  const channels = useZeroStore((s) => s.channels);
  const markOnboarded = useZeroStore((s) => s.markOnboarded);
  const [filter, setFilter] = useState<(typeof CATALOG_CATEGORIES)[number] | "All">(
    "All",
  );
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const selected = useMemo(() => new Set(channels.map((c) => c.id)), [channels]);
  const list = CATALOG.filter((c) => filter === "All" || c.category === filter);

  async function addCustom(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setBusy(true);
    try {
      const ch = await resolveChannel({ data: q });
      follow({ ...ch, tags: [] });
      setQ("");
      toast.success(`Following ${ch.title}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not find that channel");
    } finally {
      setBusy(false);
    }
  }

  if (step === 0) {
    return (
      <div className="flex min-h-dvh flex-col bg-bg px-6 text-fg pt-safe">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center pb-10">
          <p className="text-sm font-medium text-accent">Harbor</p>
          <h1 className="mt-3 text-5xl font-bold leading-none tracking-tight">
            Only the channels you chose.
          </h1>
          <ul className="mt-10 flex flex-col gap-6 text-base">
            <li>
              <p className="font-semibold">No home feed</p>
              <p className="mt-1 text-sm text-muted">
                New uploads from people you follow, in order. Nothing else is suggested.
              </p>
            </li>
            <li>
              <p className="font-semibold">Triage like Mail</p>
              <p className="mt-1 text-sm text-muted">
                Watch, save for tonight, or swipe clear. Reach empty and close the app.
              </p>
            </li>
            <li>
              <p className="font-semibold">Stays on this iPhone</p>
              <p className="mt-1 text-sm text-muted">
                Public RSS only. No Google account. History never leaves the device.
              </p>
            </li>
          </ul>
        </div>
        <div className="mx-auto w-full max-w-md pb-safe pb-8">
          <Button className="w-full" size="lg" onClick={() => setStep(1)}>
            Choose channels
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-bg text-fg pt-safe">
      <div className="mx-auto flex max-w-md flex-col gap-5 px-4 pb-32 pt-6">
        <header>
          <p className="text-sm font-medium text-accent">Step 2 of 2</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Follow</h1>
          <p className="mt-1 text-sm text-muted">
            Pick people you already watch. You can add an @handle anytime.
          </p>
        </header>
        <button
          type="button"
          className="rounded-xl bg-elevated px-4 py-3 text-left"
          onClick={() => {
            for (const c of CATALOG.slice(0, 3)) {
              if (!selected.has(c.id)) follow({ ...c, tags: [] });
            }
          }}
        >
          <span className="block text-sm font-medium text-accent">Follow a starter set</span>
          <span className="mt-0.5 block text-xs text-muted">
            {CATALOG.slice(0, 3).map((c) => c.title).join(" · ")}
          </span>
        </button>
        <form onSubmit={addCustom} className="flex gap-2">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="@handle or channel URL"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
          <Button type="submit" disabled={busy}>
            {busy ? "…" : "Add"}
          </Button>
        </form>
        <div className="flex flex-wrap gap-1.5">
          {(["All", ...CATALOG_CATEGORIES] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setFilter(c)}
              className={cn(
                "h-8 rounded-full px-3 text-xs font-medium",
                filter === c ? "bg-accent text-accent-fg" : "bg-elevated text-muted",
              )}
            >
              {c}
            </button>
          ))}
        </div>
        <ul className="overflow-hidden rounded-xl bg-surface">
          {list.map((c, i) => {
            const on = selected.has(c.id);
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => (on ? unfollow(c.id) : follow({ ...c, tags: [] }))}
                  className={cn(
                    "flex w-full items-center gap-3 px-3 py-2.5 text-left",
                    i < list.length - 1 && "shadow-[inset_0_-0.5px_0_var(--color-border)]",
                  )}
                >
                  <ChannelAvatar title={c.title} src={c.thumbnail} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{c.title}</span>
                    <span className="block truncate text-xs text-muted">{c.blurb}</span>
                  </span>
                  <span
                    className={cn(
                      "text-sm font-medium",
                      on ? "text-good" : "text-accent",
                    )}
                  >
                    {on ? "Following" : "Follow"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="fixed inset-x-0 bottom-0 border-t border-border/70 bg-bg/90 px-4 py-3 backdrop-blur-xl pb-safe">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3">
          <p className="text-sm text-muted">
            {selected.size === 0 ? "Follow at least one" : `${selected.size} following`}
          </p>
          <Button disabled={selected.size === 0} onClick={() => markOnboarded()}>
            Open Harbor
          </Button>
        </div>
      </div>
    </div>
  );
}
