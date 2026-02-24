import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Call this when user opens a conversation
export const markAsRead = mutation({
  args: {
    clerkId: v.string(),
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("readStatus")
      .withIndex("by_clerkId_and_conversation", (q) =>
        q.eq("clerkId", args.clerkId).eq("conversationId", args.conversationId)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { lastReadTime: Date.now() });
    } else {
      await ctx.db.insert("readStatus", {
        clerkId: args.clerkId,
        conversationId: args.conversationId,
        lastReadTime: Date.now(),
      });
    }
  },
});

// Get unread count for a conversation
export const getUnreadCount = query({
  args: {
    clerkId: v.string(),
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const readRecord = await ctx.db
      .query("readStatus")
      .withIndex("by_clerkId_and_conversation", (q) =>
        q.eq("clerkId", args.clerkId).eq("conversationId", args.conversationId)
      )
      .unique();

    const lastReadTime = readRecord?.lastReadTime ?? 0;

    // Count messages after lastReadTime not sent by current user
    const unread = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();

    return unread.filter(
      (m) => m.createdAt > lastReadTime && m.senderId !== args.clerkId
    ).length;
  },
});