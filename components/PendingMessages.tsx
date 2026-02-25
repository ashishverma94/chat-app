"use client";

import { RefreshCcw } from "lucide-react";

export type MessageStatus = "sending" | "sent" | "failed";

export type PendingMessage = {
  tempId: string;
  content: string;
  status: MessageStatus;
};

interface PendingMessagesProps {
  pendingMessages: PendingMessage[];
  onRetry: (tempId: string, content: string) => void;
  onDismiss: (tempId: string) => void;
}

export function PendingMessages({
  pendingMessages,
  onRetry,
  onDismiss,
}: PendingMessagesProps) {
  if (pendingMessages.length === 0) return null;

  return (
    <>
      {pendingMessages.map((pm) => (
        <div key={pm.tempId} className="flex justify-end">
          <div className="flex flex-col items-end max-w-72 md:max-w-md lg:max-w-lg">

            {/* Bubble */}
            <div
              className={`px-4 py-2 rounded-2xl text-sm rounded-br-sm transition-opacity ${
                pm.status === "sending"
                  ? "bg-foreground/50 text-background opacity-60"
                  : "bg-red-500/90 text-white"
              }`}
            >
              <p className="text-base">{pm.content}</p>
              <p className="text-xs mt-1 text-white/60">
                {pm.status === "sending" ? "Sending..." : "Failed to send"}
              </p>
            </div>

            {/* Retry / Dismiss — only on failure */}
            {pm.status === "failed" && (
              <div className="flex items-center gap-2 mt-1 mr-1">
                <span className="text-xs text-red-500 flex items-center gap-1">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  Not delivered
                </span>

                <button
                  onClick={() => onRetry(pm.tempId, pm.content)}
                  className="text-xs cursor-pointer text-blue-500 hover:text-blue-400 flex items-center gap-1 transition-colors"
                >
                  <RefreshCcw size={11} />
                  Retry
                </button>

                <button
                  onClick={() => onDismiss(pm.tempId)}
                  className="text-xs cursor-pointer text-slate-400 hover:text-slate-300 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </>
  );
}