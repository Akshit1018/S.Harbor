import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function LargeTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Group({
  header,
  footer,
  children,
}: {
  header?: string;
  footer?: string;
  children: ReactNode;
}) {
  return (
    <section className="mb-7">
      {header && (
        <p className="mb-2 px-4 text-xs font-medium uppercase tracking-wide text-subtle">
          {header}
        </p>
      )}
      <div className="overflow-hidden rounded-xl bg-surface">{children}</div>
      {footer && <p className="mt-2 px-4 text-xs text-subtle">{footer}</p>}
    </section>
  );
}

export function GroupRow({
  children,
  onClick,
  chevron,
  last,
}: {
  children: ReactNode;
  onClick?: () => void;
  chevron?: boolean;
  last?: boolean;
}) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "flex min-h-11 w-full items-center gap-3 px-4 py-2.5 text-left",
        !last && "shadow-[inset_0_-0.5px_0_var(--color-border)]",
      )}
    >
      <span className="min-w-0 flex-1">{children}</span>
      {chevron && <ChevronRight className="size-4 shrink-0 text-subtle" />}
    </Comp>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="px-6 py-16 text-center">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted">{body}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function FeedSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl bg-surface">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex gap-3 px-3 py-3">
          <div className="h-16 w-28 animate-pulse rounded-md bg-elevated" />
          <div className="flex-1 space-y-2 py-1">
            <div className="h-3.5 w-4/5 animate-pulse rounded bg-elevated" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-elevated" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { id: T; label: string }[];
}) {
  return (
    <div className="grid auto-cols-fr grid-flow-col rounded-lg bg-elevated p-0.5">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={cn(
            "h-8 rounded-md text-xs font-medium transition-colors duration-150",
            value === o.id ? "bg-fill text-fg" : "text-muted",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function SearchField({
  value,
  onChange,
  placeholder = "Search",
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  id?: string;
}) {
  return (
    <input
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
      className="h-9 w-full rounded-lg bg-elevated px-3 text-sm text-fg placeholder:text-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
    />
  );
}

export function ChipRow({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">{children}</div>
  );
}

export function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-8 shrink-0 rounded-full px-3 text-xs font-medium",
        active ? "bg-accent text-accent-fg" : "bg-elevated text-muted",
      )}
    >
      {children}
    </button>
  );
}
