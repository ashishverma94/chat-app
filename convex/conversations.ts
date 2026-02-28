import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getOrCreateConversation = mutation({
  args: {
    currentUserId: v.string(),
    otherUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const { currentUserId, otherUserId } = args;

    // ✅ Find existing DM — must NOT be a group
    const allConversations = await ctx.db.query("conversations").collect();

    const existing = allConversations.find(
      (c) =>
        !c.isGroup &&                                          // ✅ DMs only
        c.participantIds.includes(currentUserId) &&
        c.participantIds.includes(otherUserId) &&
        c.participantIds.length === 2                         // ✅ exactly 2 participants
    );

    if (existing) return existing._id;

    // Create new DM conversation
    return await ctx.db.insert("conversations", {
      participantIds: [currentUserId, otherUserId],
      isGroup: false,
      createdBy: currentUserId,
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
    const { currentUserId, otherUserId } = args;

    const allConversations = await ctx.db.query("conversations").collect();

    const conversation = allConversations.find(
      (c) =>
        !c.isGroup &&                                        // ✅ DMs only
        c.participantIds.includes(currentUserId) &&
        c.participantIds.includes(otherUserId) &&
        c.participantIds.length === 2                       // ✅ exactly 2 participants
    );

    return conversation?._id ?? null;
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
      (c) => c.isGroup && c.participantIds.includes(args.currentUserId),
    );
  },
});
