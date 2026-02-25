import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getOrCreateConversation = mutation({
  args: {
    currentUserId: v.string(),
    otherUserId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if conversation already exists
    const existing = await ctx.db.query("conversations").collect();
    const found = existing.find(
      (c) =>
        c.participantIds.includes(args.currentUserId) &&
        c.participantIds.includes(args.otherUserId)
    );
    if (found) return found._id;

    // Create new conversation
    return await ctx.db.insert("conversations", {
      participantIds: [args.currentUserId, args.otherUserId],
    });
  },
});

export const getUserConversations = query({
  args: { currentUserId: v.string() },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("conversations").collect();
    return all.filter((c) => c.participantIds.includes(args.currentUserId));
  },
});

export const getConversationId = query({
  args: {
    currentUserId: v.string(),
    otherUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("conversations").collect();
    const found = all.find(
      (c) =>
        c.participantIds.includes(args.currentUserId) &&
        c.participantIds.includes(args.otherUserId)
    );
    return found?._id ?? null;
  },
});

export const createGroupConversation = mutation({
  args: {
    participantIds: v.array(v.string()),
    groupName: v.string(),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("conversations", {
      participantIds: [...args.participantIds, args.createdBy],
      isGroup: true,
      groupName: args.groupName,
      createdBy: args.createdBy,
    });
  },
});

export const getGroupConversations = query({
  args: { currentUserId: v.string() },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("conversations").collect();
    return all.filter(
      (c) => c.isGroup && c.participantIds.includes(args.currentUserId)
    );
  },
});
