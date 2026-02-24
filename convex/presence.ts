import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const updatePresence = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("presence")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        lastSeen: Date.now(),
        isOnline: true,
      });
    } else {
      await ctx.db.insert("presence", {
        clerkId: args.clerkId,
        lastSeen: Date.now(),
        isOnline: true,
      });
    }
  },
});

// Called when user closes/leaves the app
export const setOffline = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("presence")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        isOnline: false,
        lastSeen: Date.now(),
      });
    }
  },
});

// Get all presence records
export const getAllPresence = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("presence").collect();
  },
});