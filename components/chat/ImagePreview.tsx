"use client";

import { X } from "lucide-react";

interface ImagePreviewProps {
  previewUrl: string;
  progress: number; // 0 = idle, 1-99 = uploading, 100 = done
  onRemove: () => void;
}

export function ImagePreview({
  previewUrl,
  progress,
  onRemove,
}: ImagePreviewProps) {
  const isUploading = progress > 0 && progress < 100;
  const isDone = progress === 100;

  return (
    <div className="px-4 pb-2">
      <div className="relative inline-block">
        {/* Image */}
        <img
          src={previewUrl}
          alt="Preview"
          className={`max-h-40 rounded-xl border border-slate-200 dark:border-slate-700 object-cover transition-opacity duration-200 ${
            isUploading ? "opacity-50" : "opacity-100"
          }`}
        />

        {/* ✅ Progress overlay — visible from 1% to 100% */}
        {(isUploading || isDone) && (
          <div className="flex flex-col gap-0.5 w-full min-w-30 mt-3 text-center">
            {/* Track */}
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-150 ${
                  isDone ? "bg-green-500" : "bg-blue-500"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
            {/* Label */}
            <p className="text-[11px] text-muted-foreground font-medium">
              {isDone ? "✓ Upload complete" : `Uploading... ${progress}%`}
            </p>
          </div>
        )}

        {/* ✅ Remove button — only when not uploading */}
        {!isUploading && (
          <button
            onClick={onRemove}
            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow"
          >
            <X size={12} />
          </button>
        )}
      </div>
    </div>
  );
}
