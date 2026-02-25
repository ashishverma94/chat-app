"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { formatMessageTime } from "@/utils/formatTime";
import { ArrowLeftCircle, Users } from "lucide-react";
import { useGlobalStore } from "@/store/globalStore";
import { Id } from "@/convex/_generated/dataModel";
import { MessageReactions, EmojiPicker } from "@/components/MessageReactions";

export default function GroupChatPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { user } = useUser();
  const router = useRouter();
  const { setSidebarOpen } = useGlobalStore();
  const [input, setInput] = useState("");
  const [pickerOpenFor, setPickerOpenFor] = useState<string | null>(null);
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

  // Get all members
  const allUsers = useQuery(api.users.getAllUsers, { currentClerkId: "" });
  const members = (allUsers ?? []).filter((u) =>
    group?.participantIds.includes(u.clerkId)
  );

  // Messages
  const messages = useQuery(api.messages.getMessages, { conversationId });
  const sendMessage = useMutation(api.messages.sendMessage);
  const deleteMessage = useMutation(api.messages.deleteMessage);
  const markAsRead = useMutation(api.readStatus.markAsRead);
  const setTypingMutation = useMutation(api.typing.setTyping);
  const toggleReaction = useMutation(api.reactions.toggleReaction);

  const typingUsers = useQuery(
    api.typing.getTypingUsers,
    { conversationId, currentUserId: currentClerkId }
  );

  const messageIds = (messages ?? []).map((m) => m._id);
  const reactionsMap = useQuery(
    api.reactions.getReactionsForConversation,
    messageIds.length > 0 ? { messageIds } : "skip"
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
    const dist = container.scrollHeight - container.scrollTop - container.clientHeight;
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
    setTypingMutation({ conversationId, userId: currentClerkId, userName: user?.firstName ?? "Someone", isTyping: false });
    await sendMessage({ conversationId, senderId: currentClerkId, content });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Get sender name for group messages
  const getSenderName = (senderId: string) => {
    const member = (allUsers ?? []).find((u) => u.clerkId === senderId);
    return member?.name ?? "Unknown";
  };

  const getSenderImage = (senderId: string) => {
    const member = (allUsers ?? []).find((u) => u.clerkId === senderId);
    return member?.imageUrl ?? "";
  };

  if (!group) {
    return (
      <div className="flex flex-1 items-center justify-center h-full">
        <p className="text-sm text-muted-foreground">Loading group...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" onClick={() => setPickerOpenFor(null)}>
      {/* Header */}
      <div className="p-4 h-16 border-b-2 border-slate-200 dark:border-slate-800 flex items-center gap-1">
        <button
          onClick={() => { router.push("/chat"); setSidebarOpen(true); }}
          className="mr-3 text-lg md:hidden"
        >
          <ArrowLeftCircle color="#B8B8B8" size={30} />
        </button>
        <div className="flex items-center gap-3">
          {/* Group avatar */}
          <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
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
          <p className="text-sm text-muted-foreground text-center">Loading...</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center mt-8">
            No messages yet. Start the conversation! 👋
          </p>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentClerkId;
            const msgReactions = reactionsMap[msg._id] ?? [];

            return (
              <div
                key={msg._id}
                className={`flex group ${isMe ? "justify-end" : "justify-start"}`}
                onClick={() => setPickerOpenFor(null)}
              >
                {/* Delete button */}
                {isMe && !msg.isDeleted && (
                  <button
                    onClick={() => deleteMessage({ messageId: msg._id, clerkId: currentClerkId })}
                    className="self-center cursor-pointer mr-2 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14H6L5 6" />
                      <path d="M10 11v6M14 11v6" />
                      <path d="M9 6V4h6v2" />
                    </svg>
                  </button>
                )}

                {/* Avatar for others */}
                {!isMe && (
                  <img
                    src={getSenderImage(msg.senderId)}
                    alt={getSenderName(msg.senderId)}
                    className="w-7 h-7 rounded-full object-cover self-end mr-2 flex-shrink-0"
                  />
                )}

                <div className="flex flex-col max-w-xs lg:max-w-md">
                  {/* Sender name for group */}
                  {!isMe && (
                    <span className="text-xs text-muted-foreground mb-1 ml-1">
                      {getSenderName(msg.senderId)}
                    </span>
                  )}

                  <div className={`flex items-end gap-1 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                    {/* Bubble */}
                    <div
                      className={`px-4 py-2 rounded-2xl text-sm ${
                        isMe
                          ? "bg-foreground text-background rounded-br-sm"
                          : "bg-slate-100 dark:bg-slate-800 text-foreground rounded-bl-sm"
                      }`}
                    >
                      {msg.isDeleted ? (
                        <p className="italic">This message was deleted</p>
                      ) : (
                        <p>{msg.content}</p>
                      )}
                      <p className={`text-xs mt-1 ${isMe ? "text-background/60" : "text-muted-foreground"}`}>
                        {formatMessageTime(msg.createdAt)}
                        {msg.isDeleted && " · deleted"}
                      </p>
                    </div>

                    {/* React button */}
                    {!msg.isDeleted && (
                      <div className="relative opacity-0 group-hover:opacity-100 transition-opacity mb-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPickerOpenFor(pickerOpenFor === msg._id ? null : msg._id);
                          }}
                          className="text-muted-foreground hover:text-foreground text-base leading-none"
                        >
                          😊
                        </button>
                        <EmojiPicker
                          visible={pickerOpenFor === msg._id}
                          onSelect={(emoji) => {
                            toggleReaction({ messageId: msg._id, clerkId: currentClerkId, emoji });
                            setPickerOpenFor(null);
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Reactions */}
                  {msgReactions.length > 0 && (
                    <MessageReactions
                      messageId={msg._id}
                      reactions={msgReactions}
                      currentClerkId={currentClerkId}
                      isMe={isMe}
                      onReact={(emoji) =>
                        toggleReaction({ messageId: msg._id, clerkId: currentClerkId, emoji })
                      }
                    />
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {typingUsers && typingUsers.length > 0 && (
          <div className="flex items-center gap-2 px-2 text-xs text-muted-foreground">
            <span className="text-xs">{typingUsers.map((u: any) => u.userName).join(", ")} typing</span>
            <span className="flex gap-0.5">
              {[0, 1, 2].map((i) => (
                <span key={i} className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
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
            ↓ {unreadScrollCount} New {unreadScrollCount === 1 ? "message" : "messages"}
          </button>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t-2 border-slate-200 dark:border-slate-800 flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setTypingMutation({ conversationId, userId: currentClerkId, userName: user?.firstName ?? "Someone", isTyping: true });
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
              setTypingMutation({ conversationId, userId: currentClerkId, userName: user?.firstName ?? "Someone", isTyping: false });
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