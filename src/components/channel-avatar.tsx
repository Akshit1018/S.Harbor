import { useState } from "react";
import { initials } from "@/lib/format";
import { cn } from "@/lib/cn";

export function ChannelAvatar({
  title,
  src,
  size = "md",
}: {
  title: string;
  src?: string;
  size?: "sm" | "md" | "lg";
}) {
  const [failed, setFailed] = useState(false);
  const dim = size === "sm" ? "size-8" : size === "lg" ? "size-14" : "size-10";
  if (src && !failed) {
    return (
      <img
        src={src}
        alt=""
        className={cn("shrink-0 rounded-full object-cover", dim)}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-elevated text-xs font-medium text-muted",
        dim,
      )}
    >
      {initials(title)}
    </span>
  );
}
