"use client";

import { useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ImageIcon } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

interface ImageUploadButtonProps {
  onFileSelected: (previewUrl: string) => void; // ✅ fires immediately on file pick
  onUpload: (storageId: Id<"_storage">) => void; // ✅ fires after upload completes
  onProgress: (progress: number) => void;
  onError: () => void;
}

export function ImageUploadButton({
  onFileSelected,
  onUpload,
  onProgress,
  onError,
}: ImageUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const generateUploadUrl = useMutation(api.messages.generateUploadUrl);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return;

    // ✅ Step 1: Show preview immediately — before upload starts
    const previewUrl = URL.createObjectURL(file);
    onFileSelected(previewUrl);
    onProgress(1);
    setUploading(true);

    try {
      // ✅ Step 2: Get upload URL from Convex
      const uploadUrl = await generateUploadUrl();

      // ✅ Step 3: Upload with XHR so we get progress events
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const percent = Math.min(95, Math.max(5, Math.round((e.loaded / e.total) * 100)));
            onProgress(percent);
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const { storageId } = JSON.parse(xhr.responseText);
            onProgress(100);
            // ✅ Step 4: Brief pause so user sees 100%, then notify parent
            setTimeout(() => {
              onUpload(storageId);
            }, 500);
            resolve();
          } else {
            reject(new Error("Upload failed"));
          }
        });

        xhr.addEventListener("error", () => reject(new Error("Network error")));

        xhr.open("POST", uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
      });

    } catch {
      onError();
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="text-muted-foreground cursor-pointer hover:text-foreground transition-colors disabled:opacity-40"
        title="Send image"
      >
        <ImageIcon size={20} />
      </button>
    </>
  );
}