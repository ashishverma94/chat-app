"use client";

import {
  Users,
  WifiOff,
  SendHorizonal,
  ArrowLeftCircle,
  MessageSquareOff,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import ErrorBanner from "@/components/ErrorBanner";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useGlobalStore } from "@/store/globalStore";
import ChatSkeleton from "@/components/ChatSkeleton";
import { useParams, useRouter } from "next/navigation";
import FullPageError from "@/components/FullPageError";
import { MessageBubble } from "@/components/MessageBubble";
import MessageSkeleton from "@/components/MessageSkeleton";
import { TypingIndicator } from "@/components/TypingIndicator";
import { ScrollToBottomButton } from "@/components/ScrollToBottomButton";
import { PendingMessage, PendingMessages } from "@/components/PendingMessages";
import { ImagePreview } from "@/components/chat/ImagePreview";
import { ImageUploadButton } from "@/components/chat/ImgUploadBtn";

export default function ChatPage() {
  const { userId: chatId } = useParams<{ userId: string }>();
  const { user } = useUser();
  const router = useRouter();
  const { setSidebarOpen } = useGlobalStore();

  const [input, setInput] = useState("");

  // PENDING IMAGES AND MESSAGES
  const [pendingMessages, setPendingMessages] = useState<PendingMessage[]>([]);
  const [pendingImage, setPendingImage] = useState<{
    storageId: Id<"_storage"> | null;
    previewUrl: string;
  } | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [retryKey, setRetryKey] = useState(0);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isScrolledUpRef = useRef(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [unreadScrollCount, setUnreadScrollCount] = useState(0);
  const prevMessageCount = useRef(0);

  const currentClerkId = user?.id ?? "";
  const isGroup = !chatId.startsWith("user_");

  const generateUploadUrl = useMutation(api.messages.generateUploadUrl);

  // ── DM queries ───────────────────────────────────────────
  const otherUser = useQuery(
    api.users.getUserByClerkId,
    !isGroup ? { clerkId: chatId } : "skip",
  );

  const dmConversationId = useQuery(
    api.conversations.getConversationId,
    !isGroup ? { currentUserId: currentClerkId, otherUserId: chatId } : "skip",
  );

  const createConversation = useMutation(
    api.conversations.getOrCreateConversation,
  );

  useEffect(() => {
    if (!isGroup && currentClerkId && chatId) {
      createConversation({
        currentUserId: currentClerkId,
        otherUserId: chatId,
      }).catch(() => {});
    }
  }, [currentClerkId, chatId, isGroup, retryKey]);

  // ── Group queries ────────────────────────────────────────
  const allConversations = useQuery(
    api.conversations.getUserConversations,
    isGroup ? { currentUserId: currentClerkId } : "skip",
  );
  const group = isGroup
    ? allConversations?.find((c) => c._id === chatId)
    : null;

  // ── Shared ───────────────────────────────────────────────
  const conversationId = isGroup
    ? (chatId as Id<"conversations">)
    : (dmConversationId ?? null);

  const allUsers =
    useQuery(api.users.getAllUsers, { currentClerkId: "" }) ?? [];

  const allPresence =
    useQuery(api.presence.getAllPresence, !isGroup ? {} : "skip") ?? [];

  const isOnline = (clerkId: string) => {
    const record = allPresence.find((p) => p.clerkId === clerkId);
    if (!record) return false;
    return record.isOnline && Date.now() - record.lastSeen < 20000;
  };

  const messages = useQuery(
    api.messages.getMessages,
    conversationId ? { conversationId } : "skip",
  );

  const sendMessage = useMutation(api.messages.sendMessage);
  const deleteMessage = useMutation(api.messages.deleteMessage);
  const markAsRead = useMutation(api.readStatus.markAsRead);
  const setTypingMutation = useMutation(api.typing.setTyping);
  const toggleReaction = useMutation(api.reactions.toggleReaction);

  const typingUsers = useQuery(
    api.typing.getTypingUsers,
    conversationId ? { conversationId, currentUserId: currentClerkId } : "skip",
  );

  const messageIds = (messages ?? []).map((m) => m._id);
  const reactionsMap =
    useQuery(
      api.reactions.getReactionsForConversation,
      messageIds.length > 0 ? { messageIds } : "skip",
    ) ?? {};

  // Mark as read
  useEffect(() => {
    if (conversationId && currentClerkId) {
      markAsRead({ clerkId: currentClerkId, conversationId }).catch(() => {});
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

  // Send with pending/retry
  const handleSend = async (content?: string) => {
    const text = content ?? input.trim();
    if (!text && !pendingImage) return;
    if (!conversationId) return;
    if (pendingImage?.storageId === null) return;
    if (!content) setInput("");

    const imageToSend = pendingImage;
    setPendingImage(null);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setTypingMutation({
      conversationId,
      userId: currentClerkId,
      userName: user?.firstName ?? "Someone",
      isTyping: false,
    }).catch(() => {});

    const tempId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    setPendingMessages((prev) => [
      ...prev,
      { tempId, content: text, status: "sending" },
    ]);

    try {
      await sendMessage({
        conversationId,
        senderId: currentClerkId,
        content: text,
        storageId: imageToSend?.storageId as any,
      });
      setPendingMessages((prev) => prev.filter((m) => m.tempId !== tempId));
    } catch {
      setPendingMessages((prev) =>
        prev.map((m) => (m.tempId === tempId ? { ...m, status: "failed" } : m)),
      );
    }
  };

  const handleRetry = (tempId: string, content: string) => {
    setPendingMessages((prev) => prev.filter((m) => m.tempId !== tempId));
    handleSend(content);
  };

  const handleDismiss = (tempId: string) => {
    setPendingMessages((prev) => prev.filter((m) => m.tempId !== tempId));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Error states ─────────────────────────────────────────
  if (!isGroup && otherUser === null) {
    return (
      <FullPageError
        title="User not found"
        description="This user doesn't exist or may have been removed."
        onRetry={() => router.push("/chat")}
      />
    );
  }

  if (isGroup && allConversations !== undefined && !group) {
    return (
      <FullPageError
        title="Group not found"
        description="This group doesn't exist or you're not a member."
        onRetry={() => router.push("/chat")}
      />
    );
  }

  // ── Loading ───────────────────────────────────────────────
  if (isGroup ? !group : !otherUser) return <ChatSkeleton />;

  // ── Header ────────────────────────────────────────────────
  const headerContent = isGroup ? (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
        <Users size={18} className="text-muted-foreground" />
      </div>
      <div>
        <p className="font-semibold text-sm">{group!.groupName}</p>
        <p className="text-xs text-muted-foreground">
          {group!.participantIds.length} members
        </p>
      </div>
    </div>
  ) : (
    <div className="flex flex-row gap-3">
      <div className="relative">
        <img
          src={otherUser!.imageUrl}
          alt={otherUser!.name}
          className="w-9 h-9 rounded-full object-cover"
        />
        {isOnline(chatId) && (
          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-background rounded-full" />
        )}
      </div>
      <div>
        <div className="flex flex-row gap-2">
          <p className="font-semibold text-sm">{otherUser!.name}</p>
          {isOnline(chatId) && (
            <span className="text-[12px] mt-0.5 text-gray-500 font-semibold">
              ( Online )
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{otherUser!.email}</p>
      </div>
    </div>
  );

  const placeholderName = isGroup ? group!.groupName : otherUser!.name;
  const emptyMessage = isGroup
    ? "No messages yet.\nStart the conversation! 👋"
    : `No messages yet.\nSay hi to ${otherUser!.name}! 👋`;

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
        {headerContent}
      </div>

      {/* Error banner */}
      {messages === null && (
        <ErrorBanner
          message="Couldn't load messages. Check your connection."
          onRetry={() => setRetryKey((k) => k + 1)}
        />
      )}

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 flex flex-col gap-3"
      >
        {messages === undefined ? (
          <MessageSkeleton />
        ) : messages === null ? (
          <FullPageError
            title="Failed to load messages"
            description="We couldn't fetch the messages. Please check your connection and try again."
            onRetry={() => setRetryKey((k) => k + 1)}
          />
        ) : messages.length === 0 ? (
          <div className="text-base h-full flex-col pb-5 flex justify-center items-center gap-2 text-muted-foreground text-center">
            <MessageSquareOff className="size-8" />
            <span className="whitespace-pre-line">{emptyMessage}</span>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg._id}
              msg={msg}
              isMe={msg.senderId === currentClerkId}
              isGroup={isGroup}
              currentClerkId={currentClerkId}
              allUsers={allUsers}
              reactionsMap={reactionsMap}
              onDelete={(id) =>
                deleteMessage({ messageId: id, clerkId: currentClerkId }).catch(
                  () => {},
                )
              }
              onReact={(id, emoji) =>
                toggleReaction({
                  messageId: id,
                  clerkId: currentClerkId,
                  emoji,
                }).catch(() => {})
              }
            />
          ))
        )}

        <TypingIndicator typingUsers={typingUsers ?? []} isGroup={isGroup} />

        <PendingMessages
          pendingMessages={pendingMessages}
          onRetry={handleRetry}
          onDismiss={handleDismiss}
        />

        <div ref={bottomRef} className="w-full" />
      </div>

      <ScrollToBottomButton
        show={showScrollButton}
        count={unreadScrollCount}
        onClick={scrollToBottom}
      />

      {/* Image preview above input */}
        {pendingImage && (
          <ImagePreview
            previewUrl={pendingImage.previewUrl}
            progress={uploadProgress}
            onRemove={() => {
              setPendingImage(null);
              setUploadProgress(0);
            }}
          />
        )}
    

      {/* Input */}
      <div className="p-4 h-20 relative border-t-2 border-slate-200 dark:border-slate-800 flex gap-3">
        <div className=" absolute left-7 pb-3 top-1/2 -translate-y-[25%]">
          <ImageUploadButton
            onFileSelected={(previewUrl) => {
              // ✅ Show preview IMMEDIATELY when file is picked — before upload starts
              setPendingImage({ storageId: null, previewUrl });
              setUploadProgress(0);
            }}
            onUpload={(storageId) => {
              // ✅ Just update storageId once upload completes
              setPendingImage((prev) => (prev ? { ...prev, storageId } : null));
            }}
            onProgress={setUploadProgress}
            onError={() => {
              setPendingImage(null);
              setUploadProgress(0);
            }}
          />
        </div>

        {messages === null ? (
          <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground gap-2">
            <WifiOff size={14} />
            <span>Can't send messages — connection lost</span>
          </div>
        ) : (
          <>
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
                }).catch(() => {});
                if (typingTimeoutRef.current)
                  clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = setTimeout(() => {
                  setTypingMutation({
                    conversationId,
                    userId: currentClerkId,
                    userName: user?.firstName ?? "Someone",
                    isTyping: false,
                  }).catch(() => {});
                }, 2000);
              }}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${placeholderName}...`}
              className="flex-1 pl-11 pr-4 py-2 text-sm rounded-md border border-slate-400 dark:border-slate-800 bg-background focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
            <button
              onClick={() => handleSend()}
              disabled={
                (!input.trim() && !pendingImage) ||
                pendingImage?.storageId === null
              }
              className={`${input || pendingImage ? "bg-slate-800 cursor-pointer" : "bg-foreground"} text-background px-3 py-2 rounded-full text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity`}
            >
              <SendHorizonal />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
