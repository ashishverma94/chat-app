import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const ALLOWED_EMOJIS = ["👍", "❤️", "😂", "😮", "😢"];

export const toggleReaction = mutation({
  args: {
    messageId: v.id("messages"),
    clerkId: v.string(),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    const ALLOWED_EMOJIS = ["👍", "❤️", "😂", "😮", "😢"];
    if (!ALLOWED_EMOJIS.includes(args.emoji)) return;

    // ✅ Find ANY existing reaction from this user on this message
    // (regardless of which emoji)
    const existing = await ctx.db
      .query("reactions")
      .withIndex("by_message_and_user", (q) =>
        q.eq("messageId", args.messageId).eq("clerkId", args.clerkId)
      )
      .unique();

    if (existing) {
      if (existing.emoji === args.emoji) {
        // ✅ Same emoji clicked again → remove it (toggle off)
        await ctx.db.delete(existing._id);
      } else {
        // ✅ Different emoji → replace old with new
        await ctx.db.patch(existing._id, { emoji: args.emoji });
      }
    } else {
      // ✅ No reaction yet → add new one
      await ctx.db.insert("reactions", {
        messageId: args.messageId,
        clerkId: args.clerkId,
        emoji: args.emoji,
      });
    }
  },
});

export const getReactionsForConversation = query({
  args: { messageIds: v.array(v.id("messages")) },
  handler: async (ctx, args) => {
    const all = await Promise.all(
      args.messageIds.map((id) =>
        ctx.db
          .query("reactions")
          .withIndex("by_message", (q) => q.eq("messageId", id))
          .collect()
      )
    );
    // Return flat map of messageId → reactions
    const result: Record<string, { emoji: string; clerkId: string }[]> = {};
    args.messageIds.forEach((id, i) => {
      result[id] = all[i].map((r) => ({ emoji: r.emoji, clerkId: r.clerkId }));
    });
    return result;
  },
});