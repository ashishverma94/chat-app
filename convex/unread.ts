import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Call when user opens a conversation
export const markAsRead = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversation_user", (q) =>
        q.eq("conversationId", args.conversationId).eq("userId", args.userId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { lastReadTime: Date.now() });
    } else {
      await ctx.db.insert("conversationMembers", {
        conversationId: args.conversationId,
        userId: args.userId,
        lastReadTime: Date.now(),
      });
    }
  },
});

// Get unread counts for all conversations for one user
export const getAllUnreadCounts = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    if (!args.userId) return {};

    const members = await ctx.db
      .query("conversationMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const lastReadMap: Record<string, number> = Object.fromEntries(
      members.map((m) => [m.conversationId, m.lastReadTime])
    );

    const conversations = await ctx.db.query("conversations").collect();
    const counts: Record<string, number> = {};

    for (const conv of conversations) {
      const lastRead = lastReadMap[conv._id] ?? 0;
      const unread = await ctx.db
        .query("messages")
        .withIndex("by_conversation", (q) =>
          q.eq("conversationId", conv._id)
        )
        .filter((q) =>
          q.and(
            q.gt(q.field("_creationTime"), lastRead),
            q.neq(q.field("senderId"), args.userId)
          )
        )
        .collect();
      counts[conv._id] = unread.length;
    }

    return counts;
  },
});