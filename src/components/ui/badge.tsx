import { cn } from "@/lib/cn";

export function Badge({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-elevated px-2 py-0.5 text-xs font-medium text-muted shadow-[0_0_0_1px_rgb(255_255_255/0.08)]",
        className,
      )}
    >
      {children}
    </span>
  );
}
