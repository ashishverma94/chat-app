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
  allUsers: User[]; // ✅ passed in — no need for getSenderName/Image functions
  reactionsMap: Record<string, Reaction[]>;
  onDelete: (messageId: Id<"messages">) => void;
  onReact: (messageId: Id<"messages">, emoji: string) => void;
}

// ─── Long Press Hook (inside same file, used only here) ──
function useLongPress(callback: () => void, ms = 500) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = () => {
    timerRef.current = setTimeout(callback, ms);
  };

  const stop = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  return {
    onTouchStart: start,
    onTouchEnd: stop,
    onTouchMove: stop,
  };
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
  const [menuAbove, setMenuAbove] = useState(true); // ✅ flip direction
  const bubbleRef = useRef<HTMLDivElement>(null);

  const msgReactions = reactionsMap[msg._id] ?? [];

  // Resolve sender info from allUsers list
  const sender = allUsers.find((u) => u.clerkId === msg.senderId);
  const senderName = sender?.name ?? "Unknown";
  const senderImage = sender?.imageUrl ?? "";

  const longPress = useLongPress(() => {
    if (!msg.isDeleted) {
      if (bubbleRef.current) {
        const rect = bubbleRef.current.getBoundingClientRect();
        // If less than 180px space above → show menu below bubble instead
        setMenuAbove(rect.top > 180);
      }
      setShowMenu(true);
    }
  });

  const handleOutsideClick = () => {
    setShowMenu(false);
    setPickerOpen(false);
  };

  const EMOJIS = ["👍", "❤️", "😂", "😮", "😢"];

  return (
    <div
      className={`flex group ${isMe ? "justify-end" : "justify-start"}`}
      onClick={handleOutsideClick}
    >
      {/* ── Desktop delete button (own messages only) ── */}
      {isMe && !msg.isDeleted && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(msg._id);
          }}
          className="self-center mr-2 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500 hidden md:block"
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
      )}

      {/* ── Group: sender avatar (others only) ── */}
      {isGroup && !isMe && (
        <img
          src={senderImage}
          alt={senderName}
          className="w-7 h-7 rounded-full object-cover self-end mr-2 shrink-0"
        />
      )}

      {/* ── Message column ── */}
      <div className="flex flex-col max-w-xs lg:max-w-md relative">
        {/* Group sender name */}
        {isGroup && !isMe && (
          <span className="text-xs text-muted-foreground mb-1 ml-1">
            {senderName}
          </span>
        )}

        <div
          className={`flex items-end gap-1 ${
            isMe ? "flex-row-reverse" : "flex-row"
          }`}
        >
          {/* ── Bubble ── */}
          <div
            ref={bubbleRef}
            {...longPress}
            className={`px-4 py-2 rounded-2xl text-sm select-none ${
              isMe
                ? "bg-foreground text-background rounded-br-sm"
                : "bg-slate-100 dark:bg-slate-800 text-foreground rounded-bl-sm"
            }`}
          >
            {msg.isDeleted ? (
              <p className="italic text-sm">This message was deleted</p>
            ) : (
              <p>{msg.content}</p>
            )}
            <p
              className={`text-xs mt-1 ${
                isMe ? "text-background/60" : "text-muted-foreground"
              }`}
            >
              {formatMessageTime(msg.createdAt)}
              {msg.isDeleted && " · deleted"}
            </p>
          </div>

          {/* ── Desktop emoji react button ── */}
          {!msg.isDeleted && (
            <div className="relative opacity-0 group-hover:opacity-100 transition-opacity mb-1 hidden md:block">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setPickerOpen((prev) => !prev);
                }}
                className="text-muted-foreground hover:text-foreground text-base leading-none"
                title="React"
              >
                😊
              </button>
              <EmojiPicker
                visible={pickerOpen}
                onSelect={(emoji) => {
                  onReact(msg._id, emoji);
                  setPickerOpen(false);
                }}
              />
            </div>
          )}
        </div>

        {/* ── Reaction counts ── */}
        {msgReactions.length > 0 && (
          <MessageReactions
            messageId={msg._id}
            reactions={msgReactions}
            currentClerkId={currentClerkId}
            isMe={isMe}
            onReact={(emoji) => onReact(msg._id, emoji)}
          />
        )}

        {/* ── Mobile action menu (long press) ── */}
        {showMenu && !msg.isDeleted && (
          <div
            className={`absolute h-35 z-50 bottom-full mb-2 flex flex-col gap-1 bg-background border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-2 min-w-45 ${
              isMe ? "right-0" : "left-0"
            } 
             ${menuAbove ? "bottom-full mb-2" : "top-full mt-2"}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Emoji row */}
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

            {/* Delete — own messages only */}
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

            {/* Cancel */}
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
