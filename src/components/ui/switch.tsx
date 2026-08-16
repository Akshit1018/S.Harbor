import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/cn";

export function Switch({
  checked,
  onCheckedChange,
  id,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  id?: string;
}) {
  return (
    <SwitchPrimitive.Root
      id={id}
      checked={checked}
      onCheckedChange={onCheckedChange}
      className={cn(
        "relative h-7 w-12 shrink-0 rounded-full transition-colors duration-150",
        checked ? "bg-accent" : "bg-elevated shadow-[0_0_0_1px_rgb(255_255_255/0.12)]",
      )}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "block size-5 translate-x-1 rounded-full transition-transform duration-150",
          checked ? "translate-x-6 bg-accent-fg" : "bg-muted",
        )}
      />
    </SwitchPrimitive.Root>
  );
}
