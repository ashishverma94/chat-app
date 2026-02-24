import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    imageUrl: v.string(),
  }).index("by_clerkId", ["clerkId"]),

  conversations: defineTable({
    participantIds: v.array(v.string()), // clerkIds
  }),

  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.string(), // clerkId
    content: v.string(),
    createdAt: v.number(),
  }).index("by_conversation", ["conversationId"]),

  presence: defineTable({
  clerkId: v.string(),
  lastSeen: v.number(),
  isOnline: v.boolean(),
}).index("by_clerkId", ["clerkId"]),
});