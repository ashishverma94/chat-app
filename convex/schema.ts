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
    isGroup: v.optional(v.boolean()),
    groupName: v.optional(v.string()),
    groupImage: v.optional(v.string()),
    createdBy: v.optional(v.string()),
  }),

  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.string(),
    content: v.string(),
    createdAt: v.number(),
    storageId: v.optional(v.id("_storage")),
    isDeleted: v.optional(v.boolean()),
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

  reactions: defineTable({
    messageId: v.id("messages"),
    clerkId: v.string(),
    emoji: v.string(),
  })
    .index("by_message", ["messageId"])
    .index("by_message_and_user", ["messageId", "clerkId"]),
});
