import { WifiOff, RefreshCcw } from "lucide-react";

function FullPageError({
  title,
  description,
  onRetry,
}: {
  title: string;
  description: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center h-full gap-4 text-center px-6">
      <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center">
        <WifiOff size={22} className="text-red-500" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="font-semibold text-sm">{title}</p>
        <p className="text-xs text-muted-foreground max-w-xs">{description}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 bg-foreground text-background px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <RefreshCcw size={14} />
          Try again
        </button>
      )}
    </div>
  );
}

export default FullPageError
