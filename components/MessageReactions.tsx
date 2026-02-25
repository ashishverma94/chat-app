"use client";

const EMOJIS = ["👍", "❤️", "😂", "😮", "😢"];

type Reaction = { emoji: string; clerkId: string };

interface Props {
  messageId: string;
  reactions: Reaction[];
  currentClerkId: string;
  isMe: boolean;
  onReact: (emoji: string) => void;
}

export function MessageReactions({
  reactions,
  currentClerkId,
  isMe,
  onReact,
}: Props) {
  // Group by emoji → count + whether I reacted
  const grouped = EMOJIS.map((emoji) => {
    const reacted = reactions.filter((r) => r.emoji === emoji);
    return {
      emoji,
      count: reacted.length,
      iReacted: reacted.some((r) => r.clerkId === currentClerkId),
    };
  }).filter((g) => g.count > 0);

  return (
    <div className={`flex items-center gap-1 flex-wrap mt-1 ${isMe ? "justify-end" : "justify-start"}`}>
      {grouped.map(({ emoji, count, iReacted }) => (
        <button
          key={emoji}
          onClick={() => onReact(emoji)}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-all ${
            iReacted
              ? "bg-blue-100 border-blue-300 dark:bg-blue-900/40 dark:border-blue-700"
              : "bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
          }`}
        >
          <span>{emoji}</span>
          <span className="font-medium text-foreground">{count}</span>
        </button>
      ))}
    </div>
  );
}

// Emoji picker popup
export function EmojiPicker({
  onSelect,
  visible,
}: {
  onSelect: (emoji: string) => void;
  visible: boolean;
}) {
  if (!visible) return null;

  return (
    <div className="absolute bottom-8 left-0 z-50 flex gap-1 bg-background border border-slate-200 dark:border-slate-700 rounded-full px-2 py-1.5 shadow-lg">
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(emoji);
          }}
          className="text-lg hover:scale-125 transition-transform"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}