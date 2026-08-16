import { Drawer as Vaul } from "vaul";
import { cn } from "@/lib/cn";

export const Drawer = Vaul.Root;
export const DrawerTrigger = Vaul.Trigger;
export const DrawerClose = Vaul.Close;
export const DrawerTitle = Vaul.Title;
export const DrawerDescription = Vaul.Description;

export function DrawerContent({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Vaul.Portal>
      <Vaul.Overlay className="fixed inset-0 z-50 bg-bg/70" />
      <Vaul.Content
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 mt-24 flex max-h-[88dvh] flex-col rounded-t-xl bg-surface pb-safe shadow-[0_0_0_1px_rgb(255_255_255/0.08)]",
          className,
        )}
      >
        <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-border" />
        {children}
      </Vaul.Content>
    </Vaul.Portal>
  );
}
