import { RefreshCcw, AlertTriangle } from "lucide-react";

function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 px-4 py-2 bg-red-50 dark:bg-red-950/30 border-b border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs">
      <div className="flex items-center gap-2">
        <AlertTriangle size={13} />
        <span>{message}</span>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1 text-red-500 hover:text-red-400 underline transition-colors shrink-0"
        >
          <RefreshCcw size={11} />
          Retry
        </button>
      )}
    </div>
  );
}

export default ErrorBanner