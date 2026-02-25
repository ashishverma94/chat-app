import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getMessages = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .order("asc")
      .collect();
  },
});

export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    senderId: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: args.senderId,
      content: args.content,
      createdAt: Date.now(),
    });
  },
});

export const getLastMessage = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .order("desc")
      .first();
  },
});

export const deleteMessage = mutation({
  args: {
    messageId: v.id("messages"),
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("Message not found");

    // Only sender can delete
    if (message.senderId !== args.clerkId) {
      throw new Error("Unauthorized");
    }

    // Soft delete — just mark it
    await ctx.db.patch(args.messageId, { isDeleted: true });
  },
});

export const getLastMessages = query({
  args: { conversationIds: v.array(v.id("conversations")) },
  handler: async (ctx, args) => {
    const results = await Promise.all(
      args.conversationIds.map((id) =>
        ctx.db
          .query("messages")
          .withIndex("by_conversation", (q) => q.eq("conversationId", id))
          .order("desc")
          .first()
      )
    );
    const map: Record<string, { content: string; senderId: string; isDeleted?: boolean }> = {};
    args.conversationIds.forEach((id, i) => {
      if (results[i]) {
        map[id] = {
          content: results[i]!.content,
          senderId: results[i]!.senderId,
          isDeleted: results[i]!.isDeleted,
        };
      }
    });
    return map;
  },
});