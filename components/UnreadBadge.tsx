"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export function UnreadBadge({
  clerkId,
  conversationId,
}: {
  clerkId: string;
  conversationId: Id<"conversations">;
}) {
  const count = useQuery(api.readStatus.getUnreadCount, {
    clerkId,
    conversationId,
  });

  if (!count) return null;

  return (
    <span className="ml-auto shrink-0 bg-[#161615] text-background text-xs font-bold w-5.5 h-5.5 rounded-full flex items-center justify-center">
      {count > 9 ? "9+" : count}
    </span>
  );
}
