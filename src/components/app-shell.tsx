import { Link, useRouterState } from "@tanstack/react-router";
import {
  CirclePlay,
  Clock3,
  House,
  Inbox,
  UserRound,
} from "lucide-react";
import type { ReactNode } from "react";
import { NowPlayingBar } from "@/components/now-playing";
import { cn } from "@/lib/cn";
import { useInboxCount, useShortsVideos } from "@/lib/selectors";
import { useZeroStore } from "@/lib/store";

const TABS = [
  { to: "/", label: "Today", icon: House, end: true },
  { to: "/inbox", label: "Inbox", icon: Inbox, end: false },
  { to: "/shorts", label: "Shorts", icon: CirclePlay, end: false },
  { to: "/later", label: "Saved", icon: Clock3, end: false },
  { to: "/you", label: "You", icon: UserRound, end: false },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const inboxCount = useInboxCount();
  const shortsCount = useShortsVideos().length;
  const playing = useZeroStore((s) => s.nowPlayingId);

  return (
    <div className="min-h-dvh bg-bg text-fg pt-safe">
      <main
        className={cn(
          "mx-auto w-full max-w-xl px-4 pb-28 pt-3 lg:max-w-2xl",
          playing && "pb-40",
        )}
      >
        {children}
      </main>

      <NowPlayingBar />

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border/70 bg-bg/80 backdrop-blur-xl pb-safe">
        <ul className="mx-auto grid max-w-xl grid-cols-5">
          {TABS.map((item) => {
            const active = item.end
              ? pathname === "/"
              : pathname === item.to || pathname.startsWith(`${item.to}/`);
            const Icon = item.icon;
            const badge =
              item.to === "/inbox"
                ? inboxCount
                : item.to === "/shorts"
                  ? shortsCount
                  : 0;
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  aria-label={item.label}
                  className={cn(
                    "relative flex h-12 flex-col items-center justify-center gap-0.5 text-2xs font-medium",
                    active ? "text-accent" : "text-subtle",
                  )}
                >
                  <Icon className="size-6" strokeWidth={active ? 2.15 : 1.7} />
                  {item.label}
                  {badge > 0 && (
                    <span className="absolute right-1/2 top-0.5 translate-x-3.5 rounded-full bg-live px-1 text-2xs font-semibold leading-4 text-live-fg tabular-nums">
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

export { LargeTitle as PageHeader, EmptyState, FeedSkeleton } from "./ios";
