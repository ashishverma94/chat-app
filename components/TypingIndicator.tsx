"use client";

interface TypingIndicatorProps {
  typingUsers: { userName: string }[];
  isGroup: boolean;
}

export function TypingIndicator({ typingUsers, isGroup }: TypingIndicatorProps) {
  if (!typingUsers || typingUsers.length === 0) return null;

  return (
    <div className="flex items-center gap-2 px-2 text-xs text-muted-foreground">
      {isGroup && (
        <span>
          {typingUsers.map((u) => u.userName).join(", ")} is typing
        </span>
      )}
      <span className="flex gap-0.5 mt-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2.5 h-2.5 rounded-full bg-muted-foreground animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </span>
    </div>
  );
}