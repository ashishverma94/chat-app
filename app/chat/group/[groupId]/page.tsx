"use client";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import ChatSkeleton from "@/components/ChatSkeleton";
import { useGlobalStore } from "@/store/globalStore";
import { useParams, useRouter } from "next/navigation";
import { MessageBubble } from "@/components/MessageBubble";
import MessageSkeleton from "@/components/MessageSkeleton";
import { ArrowLeftCircle, MessageSquareOff, Users } from "lucide-react";

export default function GroupChatPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { user } = useUser();
  const router = useRouter();
  const { setSidebarOpen } = useGlobalStore();
  const [input, setInput] = useState("");
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isScrolledUpRef = useRef(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [unreadScrollCount, setUnreadScrollCount] = useState(0);
  const prevMessageCount = useRef(0);

  const currentClerkId = user?.id ?? "";
  const conversationId = groupId as Id<"conversations">;

  // Get group info
  const allConversations = useQuery(api.conversations.getUserConversations, {
    currentUserId: currentClerkId,
  });
  const group = allConversations?.find((c) => c._id === conversationId);

  // ✅ Get ALL users including current user so avatars resolve correctly
  const allUsers =
    useQuery(api.users.getAllUsers, { currentClerkId: "" }) ?? [];

  // Messages
  const messages = useQuery(api.messages.getMessages, { conversationId });
  const sendMessage = useMutation(api.messages.sendMessage);
  const deleteMessage = useMutation(api.messages.deleteMessage);
  const markAsRead = useMutation(api.readStatus.markAsRead);
  const setTypingMutation = useMutation(api.typing.setTyping);
  const toggleReaction = useMutation(api.reactions.toggleReaction);

  const typingUsers = useQuery(api.typing.getTypingUsers, {
    conversationId,
    currentUserId: currentClerkId,
  });

  const messageIds = (messages ?? []).map((m) => m._id);
  const reactionsMap =
    useQuery(
      api.reactions.getReactionsForConversation,
      messageIds.length > 0 ? { messageIds } : "skip",
    ) ?? {};

  // Mark as read
  useEffect(() => {
    if (conversationId && currentClerkId) {
      markAsRead({ clerkId: currentClerkId, conversationId });
    }
  }, [conversationId, messages]);

  // Smart scroll
  useEffect(() => {
    if (!messages) return;
    const newCount = messages.length;
    const added = newCount - prevMessageCount.current;
    prevMessageCount.current = newCount;
    if (added <= 0) return;

    const latest = messages[messages.length - 1];
    const isMine = latest?.senderId === currentClerkId;

    if (isMine) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      setUnreadScrollCount(0);
      setShowScrollButton(false);
      isScrolledUpRef.current = false;
      return;
    }

    if (isScrolledUpRef.current) {
      setUnreadScrollCount((prev) => prev + added);
      setShowScrollButton(true);
    } else {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, currentClerkId]);

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const dist =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    const scrolledUp = dist > 100;
    isScrolledUpRef.current = scrolledUp;
    if (!scrolledUp) {
      setShowScrollButton(false);
      setUnreadScrollCount(0);
    }
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setUnreadScrollCount(0);
    setShowScrollButton(false);
    isScrolledUpRef.current = false;
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const content = input.trim();
    setInput("");
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setTypingMutation({
      conversationId,
      userId: currentClerkId,
      userName: user?.firstName ?? "Someone",
      isTyping: false,
    });
    await sendMessage({ conversationId, senderId: currentClerkId, content });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!group) {
    return <ChatSkeleton />;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 h-16 border-b-2 border-slate-200 dark:border-slate-800 flex items-center gap-1">
        <button
          onClick={() => {
            router.push("/chat");
            setSidebarOpen(true);
          }}
          className="mr-3 text-lg md:hidden"
        >
          <ArrowLeftCircle color="#B8B8B8" size={30} />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
            <Users size={18} className="text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold text-sm">{group.groupName}</p>
            <p className="text-xs text-muted-foreground">
              {group.participantIds.length} members
            </p>
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
          <div className="text-base h-full flex-col pb-10 flex justify-center items-center gap-2 text-muted-foreground text-center mt-8">
            <MessageSquareOff className="size-8" />
            <span>
              No messages yet.
              <br /> Start the conversation! 👋
            </span>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg._id}
              msg={msg}
              isMe={msg.senderId === currentClerkId}
              isGroup={true} 
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
          ))
        )}

        {/* Typing indicator */}
        {typingUsers && typingUsers.length > 0 && (
          <div className="flex items-center gap-2 mt-1 px-2 text-xs text-muted-foreground">
            <span>
              {typingUsers.map((u: any) => u.userName).join(", ")} is typing
            </span>
            <span className="flex gap-0.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* New messages button */}
      {showScrollButton && unreadScrollCount > 0 && (
        <div className="flex justify-center pb-2">
          <button
            onClick={scrollToBottom}
            className="flex items-center gap-2 bg-foreground text-background text-xs font-medium px-4 py-2 rounded-full shadow-lg hover:opacity-90 transition-opacity"
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
          placeholder={`Message ${group.groupName}...`}
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
