"use client";

import { useRef, useState } from "react";
import { formatMessageTime } from "@/utils/formatTime";
import { MessageReactions, EmojiPicker } from "@/components/MessageReactions";
import { Id } from "@/convex/_generated/dataModel";

// ─── Types ───────────────────────────────────────────────
type Reaction = { emoji: string; clerkId: string };

type Message = {
  _id: Id<"messages">;
  senderId: string;
  content: string;
  imageUrl?: string | null; // ✅ resolved at query time, not stored in schema
  storageId?: Id<"_storage"> | null;
  createdAt: number;
  isDeleted?: boolean;
};

type User = {
  clerkId: string;
  name: string;
  imageUrl: string;
};

interface MessageBubbleProps {
  msg: Message;
  isMe: boolean;
  isGroup: boolean;
  currentClerkId: string;
  allUsers: User[];
  reactionsMap: Record<string, Reaction[]>;
  onDelete: (messageId: Id<"messages">) => void;
  onReact: (messageId: Id<"messages">, emoji: string) => void;
}

// ─── Long Press Hook ──────────────────────────────────────
function useLongPress(callback: () => void, ms = 500) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const start = () => {
    timerRef.current = setTimeout(callback, ms);
  };
  const stop = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };
  return { onTouchStart: start, onTouchEnd: stop, onTouchMove: stop };
}

const EMOJIS = ["👍", "❤️", "😂", "😮", "😢"];

// ─── Delete Button ────────────────────────────────────────
function DeleteButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500 hidden md:flex items-center self-center cursor-pointer"
      title="Delete message"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14H6L5 6" />
        <path d="M10 11v6M14 11v6" />
        <path d="M9 6V4h6v2" />
      </svg>
    </button>
  );
}

// ─── Emoji React Button ───────────────────────────────────
function ReactButton({
  pickerOpen,
  onToggle,
  onSelect,
  isMe,
}: {
  pickerOpen: boolean;
  onToggle: () => void;
  onSelect: (emoji: string) => void;
  isMe: boolean;
}) {
  return (
    <div className="relative opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex items-center self-center">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className="text-muted-foreground hover:text-foreground cursor-pointer text-xl leading-none"
        title="React"
      >
        😊
      </button>
      {pickerOpen && (
        <div
          className={`absolute bottom-8 z-50 flex gap-1 bg-background border border-slate-200 dark:border-slate-700 rounded-full px-2 py-1.5 shadow-lg whitespace-nowrap ${
            isMe ? "right-0" : "left-0"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onSelect(emoji)}
              className="text-lg hover:scale-125 transition-transform"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Image Viewer (full screen tap) ──────────────────────
function BubbleImage({ url }: { url: string }) {
  const [fullscreen, setFullscreen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <>
      <div className="relative max-w-55 w-full rounded-xl overflow-hidden mb-1">
        {/* ✅ Skeleton shimmer shown while loading */}
        {!loaded && !error && (
          <div className="absolute inset-0 bg-slate-200 dark:bg-slate-700 animate-pulse rounded-xl" />
        )}

        {error ? (
          <div className="w-55 h-32 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-muted-foreground">
            Failed to load image
          </div>
        ) : (
          <img
            src={url}
            alt="Sent image"
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
            onClick={(e) => {
              e.stopPropagation();
              setFullscreen(true);
            }}
            className={`w-full object-cover cursor-pointer hover:opacity-95 transition-opacity duration-300 ${
              loaded ? "opacity-100" : "opacity-0"
            }`}
            // ✅ This is the key — browser loads image top-to-bottom naturally
            // opacity-0 → opacity-100 fade reveals it as it loads
            decoding="async"
            loading="lazy"
          />
        )}
      </div>

      {/* Fullscreen overlay */}
      {fullscreen && (
        <div
          className="fixed inset-0 z-100 bg-black/90 flex items-center justify-center"
          onClick={() => setFullscreen(false)}
        >
          <img
            src={url}
            alt="Full size"
            className="max-w-[95vw] max-h-[95vh] object-contain rounded-lg"
          />
          <button
            className="absolute top-4 right-4 text-white text-2xl font-bold hover:opacity-70"
            onClick={() => setFullscreen(false)}
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}

// ─── Main Component ───────────────────────────────────────
export function MessageBubble({
  msg,
  isMe,
  isGroup,
  currentClerkId,
  allUsers,
  reactionsMap,
  onDelete,
  onReact,
}: MessageBubbleProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [menuAbove, setMenuAbove] = useState(true);
  const bubbleRef = useRef<HTMLDivElement>(null);

  const msgReactions = reactionsMap[msg._id] ?? [];
  const sender = allUsers.find((u) => u.clerkId === msg.senderId);
  const senderName = sender?.name ?? "Unknown";
  const senderImage = sender?.imageUrl ?? "";

  // ✅ Image is now resolved by getMessages query — just read it directly
  const hasImage = !!msg.imageUrl;
  const hasText = !!msg.content?.trim();

  const longPress = useLongPress(() => {
    if (!msg.isDeleted) {
      if (bubbleRef.current) {
        const rect = bubbleRef.current.getBoundingClientRect();
        setMenuAbove(rect.top > 180);
      }
      setShowMenu(true);
    }
  });

  return (
    <div
      className={`flex items-end group ${isMe ? "justify-end" : "justify-start"}`}
      onClick={() => {
        setShowMenu(false);
        setPickerOpen(false);
      }}
    >
      {/* Group sender avatar */}
      {isGroup && !isMe && (
        <img
          src={senderImage}
          alt={senderName}
          className="w-7 h-7 rounded-full object-cover self-end mr-2 shrink-0 mb-5"
        />
      )}

      {/* Message column */}
      <div className="flex flex-col max-w-72 md:max-w-md lg:max-w-lg relative">
        {/* Group sender name */}
        {isGroup && !isMe && (
          <span className="text-xs text-muted-foreground mb-1 ml-1">
            {senderName}
          </span>
        )}

        <div
          className={`flex items-end gap-1.5 ${isMe ? "flex-row-reverse" : "flex-row"}`}
        >
          {/* Bubble */}
          <div
            ref={bubbleRef}
            {...longPress}
            className={`px-4 py-2 rounded-2xl text-sm select-none ${
              // ✅ Image-only messages get less padding, no bg needed
              hasImage && !hasText
                ? "p-1 bg-transparent"
                : isMe
                  ? "bg-foreground text-background rounded-br-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-foreground rounded-bl-sm"
            }`}
          >
            {msg.isDeleted ? (
              <p className={`italic text-base ${isMe ? "" : ""}`}>
                This message was deleted
              </p>
            ) : (
              <>
                {/* ✅ Image — rendered from query-resolved URL */}
                {hasImage && <BubbleImage url={msg.imageUrl!} />}

                {/* Text — only if present */}
                {hasText && <p className="text-base">{msg.content}</p>}
              </>
            )}

            {/* Timestamp */}
            <p
              className={`text-xs mt-1 ${
                hasImage && !hasText
                  ? "text-muted-foreground" // image-only: neutral timestamp
                  : isMe
                    ? "text-background/60"
                    : "text-muted-foreground"
              }`}
            >
              {formatMessageTime(msg.createdAt)}
              {msg.isDeleted && " · deleted"}
            </p>
          </div>

          {/* Action buttons */}
          {!msg.isDeleted && (
            <div
              className={`flex items-center gap-1 mb-5 ${isMe ? "flex-row-reverse" : "flex-row"}`}
            >
              <ReactButton
                pickerOpen={pickerOpen}
                onToggle={() => setPickerOpen((p) => !p)}
                onSelect={(emoji) => {
                  onReact(msg._id, emoji);
                  setPickerOpen(false);
                }}
                isMe={isMe}
              />
              {isMe && <DeleteButton onClick={() => onDelete(msg._id)} />}
            </div>
          )}
        </div>

        {/* Reaction counts */}
        {msgReactions.length > 0 && (
          <MessageReactions
            messageId={msg._id}
            reactions={msgReactions}
            currentClerkId={currentClerkId}
            isMe={isMe}
            onReact={(emoji) => onReact(msg._id, emoji)}
          />
        )}

        {/* Mobile action menu */}
        {showMenu && !msg.isDeleted && (
          <div
            className={`absolute z-50 flex flex-col gap-1 bg-background border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-2 min-w-45 ${
              isMe ? "right-0" : "left-0"
            } ${menuAbove ? "bottom-full mb-2" : "top-full mt-2"}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-around py-1.5 border-b border-slate-100 dark:border-slate-800">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    onReact(msg._id, emoji);
                    setShowMenu(false);
                  }}
                  className="text-xl hover:scale-125 transition-transform active:scale-110"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {isMe && (
              <button
                onClick={() => {
                  onDelete(msg._id);
                  setShowMenu(false);
                }}
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors w-full"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14H6L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4h6v2" />
                </svg>
                Delete message
              </button>
            )}

            <button
              onClick={() => setShowMenu(false)}
              className="flex items-center justify-center px-3 py-2 text-sm text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors w-full"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
