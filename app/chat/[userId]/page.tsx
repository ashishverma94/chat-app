"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Id } from "@/convex/_generated/dataModel";

export default function ChatPage() {
  const { userId: otherClerkId } = useParams<{ userId: string }>();
  const { user } = useUser();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const currentClerkId = user?.id ?? "";

  // Get other user's profile
  const otherUser = useQuery(api.users.getUserByClerkId, {
    clerkId: otherClerkId,
  });

  // Get or create conversation
  const conversationId = useQuery(api.conversations.getConversationId, {
    currentUserId: currentClerkId,
    otherUserId: otherClerkId,
  });

  // Real-time messages
  const messages = useQuery(
    api.messages.getMessages,
    conversationId ? { conversationId } : "skip"
  );

  const sendMessage = useMutation(api.messages.sendMessage);
  const createConversation = useMutation(api.conversations.getOrCreateConversation);

  // Auto scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Ensure conversation exists on load
  useEffect(() => {
    if (currentClerkId && otherClerkId) {
      createConversation({ currentUserId: currentClerkId, otherUserId: otherClerkId });
    }
  }, [currentClerkId, otherClerkId]);

  const handleSend = async () => {
    if (!input.trim() || !conversationId) return;
    setInput("");
    await sendMessage({
      conversationId,
      senderId: currentClerkId,
      content: input.trim(),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!otherUser) {
    return (
      <div className="flex flex-1 items-center justify-center h-full">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="p-4 border-b-2 border-slate-200 dark:border-slate-800 flex items-center gap-3">
        <img
          src={otherUser.imageUrl}
          alt={otherUser.name}
          className="w-9 h-9 rounded-full object-cover"
        />
        <div>
          <p className="font-semibold text-sm">{otherUser.name}</p>
          <p className="text-xs text-muted-foreground">{otherUser.email}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {messages === undefined ? (
          <p className="text-sm text-muted-foreground text-center">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center mt-8">
            No messages yet. Say hi to {otherUser.name}! 👋
          </p>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentClerkId;
            return (
              <div
                key={msg._id}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl text-sm ${
                    isMe
                      ? "bg-foreground text-background rounded-br-sm"
                      : "bg-slate-100 dark:bg-slate-800 text-foreground rounded-bl-sm"
                  }`}
                >
                  <p>{msg.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      isMe ? "text-background/60" : "text-muted-foreground"
                    }`}
                  >
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t-2 border-slate-200 dark:border-slate-800 flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Message ${otherUser.name}...`}
          className="flex-1 px-4 py-2 text-sm rounded-md border border-slate-200 dark:border-slate-800 bg-background focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className="bg-foreground text-background px-4 py-2 rounded-md text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity"
        >
          Send
        </button>
      </div>
    </div>
  );
}