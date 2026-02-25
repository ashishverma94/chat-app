"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { X, Users } from "lucide-react";

export function CreateGroupModal({ onClose }: { onClose: () => void }) {
  const { user } = useUser();
  const router = useRouter();
  const [groupName, setGroupName] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const currentClerkId = user?.id ?? "";

  const allUsers = useQuery(api.users.getAllUsers, { currentClerkId });
  const createGroup = useMutation(api.conversations.createGroupConversation);

  const toggleUser = (clerkId: string) => {
    setSelected((prev) =>
      prev.includes(clerkId)
        ? prev.filter((id) => id !== clerkId)
        : [...prev, clerkId]
    );
  };

  const handleCreate = async () => {
    if (!groupName.trim() || selected.length < 1) return;
    setLoading(true);
    try {
      const id = await createGroup({
        participantIds: selected,
        groupName: groupName.trim(),
        createdBy: currentClerkId,
      });
      onClose();
      router.push(`/chat/group/${id}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 bg-background border-2 border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-md mx-4 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Users size={18} />
            <h2 className="font-semibold text-sm">Create Group</h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-4">
          {/* Group name input */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Group Name
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g. Project Team, Friends..."
              className="px-3 py-2 text-sm rounded-md border border-slate-200 dark:border-slate-800 bg-background focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>

          {/* Member selection */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Add Members ({selected.length} selected)
            </label>
            <div className="flex flex-col gap-1 max-h-52 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-md p-1">
              {(allUsers ?? []).map((u) => {
                const isSelected = selected.includes(u.clerkId);
                return (
                  <button
                    key={u._id}
                    onClick={() => toggleUser(u.clerkId)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors ${
                      isSelected
                        ? "bg-foreground text-background"
                        : "hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <img
                      src={u.imageUrl}
                      alt={u.name}
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium truncate">{u.name}</span>
                      <span className={`text-xs truncate ${isSelected ? "text-background/60" : "text-muted-foreground"}`}>
                        {u.email}
                      </span>
                    </div>
                    {isSelected && (
                      <span className="ml-auto text-background text-xs font-bold">✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected previews */}
          {selected.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {selected.map((id) => {
                const u = (allUsers ?? []).find((u) => u.clerkId === id);
                if (!u) return null;
                return (
                  <span
                    key={id}
                    className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-xs px-2 py-1 rounded-full"
                  >
                    {u.name}
                    <button
                      onClick={() => toggleUser(id)}
                      className="text-muted-foreground hover:text-red-500"
                    >
                      <X size={10} />
                    </button>
                  </span>
                );
              })}
            </div>
          )}

          {/* Create button */}
          <button
            onClick={handleCreate}
            disabled={!groupName.trim() || selected.length < 1 || loading}
            className="bg-foreground text-background px-4 py-2 rounded-md text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity"
          >
            {loading ? "Creating..." : `Create Group (${selected.length + 1} members)`}
          </button>
        </div>
      </div>
    </div>
  );
}