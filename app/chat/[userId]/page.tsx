"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { formatMessageTime } from "@/utils/formatTime";
import { ArrowLeftCircle } from "lucide-react";
import { useGlobalStore } from "@/store/globalStore";

export default function ChatPage() {
  const { userId: otherClerkId } = useParams<{ userId: string }>();
  const { user } = useUser();
  const [input, setInput] = useState("");
  const { sidebarOpen, setSidebarOpen } = useGlobalStore();

  const bottomRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
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
    conversationId ? { conversationId } : "skip",
  );

  const sendMessage = useMutation(api.messages.sendMessage);
  const createConversation = useMutation(
    api.conversations.getOrCreateConversation,
  );

  // Auto scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Ensure conversation exists on load
  useEffect(() => {
    if (currentClerkId && otherClerkId) {
      createConversation({
        currentUserId: currentClerkId,
        otherUserId: otherClerkId,
      });
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

  // Add this inside your ChatPage component
  const allPresence = useQuery(api.presence.getAllPresence) ?? [];

  const isOnline = (clerkId: string) => {
    const record = allPresence.find((p) => p.clerkId === clerkId);
    if (!record) return false;
    return record.isOnline && Date.now() - record.lastSeen < 20000;
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

      <div className="p-4  h-16 border-b-2 border-slate-200 dark:border-slate-800 flex items-center gap-1">
        <button
          onClick={() => {
            router.push("/chat");
            setSidebarOpen(true);
          }}
          className="mr-3 text-lg md:hidden"
        >
          <ArrowLeftCircle color="#B8B8B8" size={30} />
        </button>
        <div className="flex flex-row gap-3">
          <div className="relative">
            <img
              src={otherUser.imageUrl}
              alt={otherUser.name}
              className="w-9 h-9 rounded-full object-cover"
            />
            {isOnline(otherClerkId) && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-background rounded-full" />
            )}
          </div>
          <div>
            <div className="flex flow-row gap-2">
              <p className="font-semibold text-sm items-end justify-end">{otherUser.name}</p>
              {isOnline(otherClerkId) && <span className="text-[12px] mt-0.5 text-gray-500 font-semibold">( Online )</span>}
            </div>
            <p className="text-xs text-muted-foreground">{otherUser.email}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {messages === undefined ? (
          <p className="text-sm text-muted-foreground text-center">
            Loading messages...
          </p>
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
                    {formatMessageTime(msg.createdAt)}
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
