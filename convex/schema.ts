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

  typingStatus: defineTable({
    conversationId: v.id("conversations"),
    clerkId: v.string(), // who is typing
    isTyping: v.boolean(),
    updatedAt: v.number(),
  }).index("by_conversation", ["conversationId"]),

  typingIndicators: defineTable({
    conversationId: v.id("conversations"),
    userId: v.string(),
    userName: v.string(),
    updatedAt: v.number(),
  }).index("by_conversation", ["conversationId"]),

  conversationMembers: defineTable({
    conversationId: v.id("conversations"),
    userId: v.string(),
    lastReadTime: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_conversation_user", ["conversationId", "userId"]),

  readStatus: defineTable({
    clerkId: v.string(),
    conversationId: v.id("conversations"),
    lastReadTime: v.number(),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_clerkId_and_conversation", ["clerkId", "conversationId"]),
});
