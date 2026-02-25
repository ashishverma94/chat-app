"use client";

interface ScrollToBottomButtonProps {
  show: boolean;
  count: number;
  onClick: () => void;
}

export function ScrollToBottomButton({
  show,
  count,
  onClick,
}: ScrollToBottomButtonProps) {
  if (!show || count === 0) return null;

  return (
    <div className="flex justify-center pb-2">
      <button
        onClick={onClick}
        className="flex items-center border-white border-2 gap-2 bg-foreground text-background text-xs font-medium px-4 py-2 rounded-full shadow-lg hover:opacity-90 transition-opacity animate-bounce"
      >
        ↓ {count} New {count === 1 ? "message" : "messages"}
      </button>
    </div>
  );
}