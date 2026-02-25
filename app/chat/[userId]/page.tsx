"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeftCircle, MessageSquareOff, SendHorizonal } from "lucide-react";
import { useGlobalStore } from "@/store/globalStore";
import { MessageBubble } from "@/components/MessageBubble";
import Skeleton from "@/components/Skeleton";
import MessageSkeleton from "@/components/MessageSkeleton";
import ChatSkeleton from "@/components/ChatSkeleton";

type MessageStatus = "sending" | "sent" | "failed";

type PendingMessage = {
  tempId: string;
  content: string;
  status: MessageStatus;
};

export default function ChatPage() {
  const { userId: otherClerkId } = useParams<{ userId: string }>();
  const { user } = useUser();
  const [input, setInput] = useState("");
  const [pendingMessages, setPendingMessages] = useState<PendingMessage[]>([]);

  const { sidebarOpen, setSidebarOpen } = useGlobalStore();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // FOR SCROLLING PURPOSES
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [unreadScrollCount, setUnreadScrollCount] = useState(0);
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const prevMessageCount = useRef(0);

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
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setTypingMutation({
      conversationId,
      userId: currentClerkId,
      userName: user?.firstName ?? "Someone",
      isTyping: false,
    });
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

  const setTypingMutation = useMutation(api.typing.setTyping);
  const deleteMessage = useMutation(api.messages.deleteMessage);
  const typingUsers = useQuery(
    api.typing.getTypingUsers,
    conversationId ? { conversationId, currentUserId: currentClerkId } : "skip",
  );

  const markAsRead = useMutation(api.readStatus.markAsRead);
  useEffect(() => {
    if (conversationId && currentClerkId) {
      markAsRead({ clerkId: currentClerkId, conversationId });
    }
  }, [conversationId, messages]);

  // Detect if user has scrolled up
  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    setIsScrolledUp(distanceFromBottom > 100);
  };

  // Smart scroll logic when new messages arrive
  useEffect(() => {
    if (!messages) return;
    const newCount = messages.length;
    const added = newCount - prevMessageCount.current;
    prevMessageCount.current = newCount;

    if (added <= 0) return;

    if (isScrolledUp) {
      // User is reading old messages — show button instead
      setUnreadScrollCount((prev) => prev + added);
    } else {
      // User is at bottom — auto scroll
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setUnreadScrollCount(0);
    setIsScrolledUp(false);
  };

  const toggleReaction = useMutation(api.reactions.toggleReaction);

  // Get all reactions for messages in this conversation
  const messageIds = (messages ?? []).map((m) => m._id);
  const reactionsMap =
    useQuery(
      api.reactions.getReactionsForConversation,
      messageIds.length > 0 ? { messageIds } : "skip",
    ) ?? {};

  const allUsers =
    useQuery(api.users.getAllUsers, { currentClerkId: "" }) ?? [];

  if (!otherUser) {
    return <ChatSkeleton />;
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
              <p className="font-semibold text-sm items-end justify-end">
                {otherUser.name}
              </p>
              {isOnline(otherClerkId) && (
                <span className="text-[12px] mt-0.5 text-gray-500 font-semibold">
                  ( Online )
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{otherUser.email}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 flex flex-col gap-3"
      >
        {messages === undefined ? (
          <MessageSkeleton />
        ) : messages.length === 0 ? (
          <div className="text-base h-full flex-col pb-5 flex justify-center items-center gap-2 text-muted-foreground text-center mt-8">
            <MessageSquareOff className="size-8" />
            <span>
              No messages yet. <br />
              Say hi to <strong>{otherUser.name}</strong>! 👋
            </span>
          </div>
        ) : (
          messages.map((msg) => {
            return (
              <MessageBubble
                key={msg._id}
                msg={msg}
                isMe={msg.senderId === currentClerkId}
                isGroup={false}
                currentClerkId={currentClerkId}
                allUsers={allUsers}
                reactionsMap={reactionsMap}
                onDelete={(id) =>
                  deleteMessage({ messageId: id, clerkId: currentClerkId })
                }
                onReact={(id, emoji) =>
                  toggleReaction({
                    messageId: id,
                    clerkId: currentClerkId,
                    emoji,
                  })
                }
              />
            );
          })
        )}
        {typingUsers && typingUsers.length > 0 && (
          <div className="flex items-center gap-2 px-2 text-xs text-muted-foreground">
            {/* <span>
              {typingUsers.map((u) => u.userName).join(", ")}{" "}
              {typingUsers.length === 1 ? "is" : "are"} typing
            </span> */}
            <span className="flex gap-0.5 mt-5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-2.5 h-2.5 rounded-full bg-muted-foreground animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </span>
          </div>
        )}
        <div
          ref={bottomRef}
          className={`${messages && messages.length > 0 && "pb-25"} w-full`}
        ></div>
      </div>

      {isScrolledUp && unreadScrollCount > 0 && (
        <div className="flex justify-center pb-2">
          <button
            onClick={scrollToBottom}
            className="flex items-center border-white border-2 gap-2 bg-foreground text-background text-xs font-medium px-4 py-2 rounded-full shadow-lg hover:opacity-90 transition-opacity animate-bounce"
          >
            ↓ {unreadScrollCount} New{" "}
            {unreadScrollCount === 1 ? "message" : "messages"}
          </button>
        </div>
      )}

      {/* Input */}
      <div className="p-4 h-20 border-t-2 border-slate-200 dark:border-slate-800 flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            if (!conversationId) return;
            setTypingMutation({
              conversationId,
              userId: currentClerkId,
              userName: user?.firstName ?? "Someone",
              isTyping: true,
            });
            if (typingTimeoutRef.current)
              clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
              setTypingMutation({
                conversationId,
                userId: currentClerkId,
                userName: user?.firstName ?? "Someone",
                isTyping: false,
              });
            }, 2000);
          }}
          onKeyDown={handleKeyDown}
          placeholder={`Message ${otherUser.name}...`}
          className="flex-1 px-4 py-2 text-sm rounded-md border border-slate-400 dark:border-slate-800 bg-background focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className={`${input ? "bg-slate-800" : "bg-foreground"} text-background px-3 py-2 rounded-full text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity`}
        >
          <SendHorizonal />
        </button>
      </div>
    </div>
  );
}
