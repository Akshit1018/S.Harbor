import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { ChannelAvatar } from "@/components/channel-avatar";
import { CATALOG } from "@/lib/catalog";
import { useFollowedIds } from "@/lib/selectors";
import { useZeroStore } from "@/lib/store";
import { resolveChannel } from "@/lib/youtube";

export function AddChannelButton({
  label = "Follow",
}: {
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button size="sm">{label}</Button>
      </DrawerTrigger>
      <DrawerContent>
        <AddChannelForm onDone={() => setOpen(false)} />
      </DrawerContent>
    </Drawer>
  );
}

export function AddChannelForm({ onDone }: { onDone?: () => void }) {
  const follow = useZeroStore((s) => s.followChannel);
  const followed = useFollowedIds();
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setBusy(true);
    try {
      const ch = await resolveChannel({ data: q });
      follow({ ...ch, tags: [] });
      toast.success(`Following ${ch.title}`);
      setQ("");
      onDone?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not find that channel");
    } finally {
      setBusy(false);
    }
  }

  const suggestions = CATALOG.filter((c) => !followed.includes(c.id)).slice(0, 6);

  return (
    <div className="flex flex-col gap-5 overflow-y-auto px-5 pb-6 pt-4">
      <div>
        <DrawerTitle className="text-2xl font-bold tracking-tight">Follow</DrawerTitle>
        <DrawerDescription className="mt-1 text-sm text-muted">
          Paste an @handle or channel URL. Public RSS only.
        </DrawerDescription>
      </div>
      <form onSubmit={submit} className="flex gap-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="@handle"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
        />
        <Button type="submit" disabled={busy}>
          {busy ? "…" : "Add"}
        </Button>
      </form>
      {suggestions.length > 0 && (
        <div>
          <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-subtle">
            Suggested
          </p>
          <ul className="overflow-hidden rounded-xl bg-elevated">
            {suggestions.map((c, i) => (
              <li key={c.id}>
                <button
                  type="button"
                  className={
                    i === suggestions.length - 1
                      ? "flex w-full items-center gap-3 px-3 py-2.5 text-left"
                      : "flex w-full items-center gap-3 px-3 py-2.5 text-left shadow-[inset_0_-0.5px_0_var(--color-border)]"
                  }
                  onClick={() => {
                    follow({ ...c, tags: [] });
                    toast.success(`Following ${c.title}`);
                  }}
                >
                  <ChannelAvatar title={c.title} src={c.thumbnail} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{c.title}</span>
                    <span className="block truncate text-xs text-muted">@{c.handle}</span>
                  </span>
                  <span className="text-sm text-accent">Follow</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <DrawerClose asChild>
        <Button variant="ghost" className="w-full">
          Close
        </Button>
      </DrawerClose>
    </div>
  );
}
