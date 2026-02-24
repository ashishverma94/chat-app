"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useGlobalStore } from "@/store/globalStore";
import { usePresence } from "@/hooks/usePresence";
import { UnreadBadge } from "@/components/UnreadBadge";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useUser();
  const { sidebarOpen } = useGlobalStore();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <div
        className={`${sidebarOpen ? "block" : "hidden"} md:block max-md:w-full`}
      >
        <Sidebar currentClerkId={user?.id ?? ""} />
      </div>

      <main
        className={`${sidebarOpen ? "hidden" : "flex"} flex-1 h-screen md:flex flex-col overflow-hidden`}
      >
        {children}
      </main>
    </div>
  );
}

function Sidebar({ currentClerkId }: { currentClerkId: string }) {
  const [search, setSearch] = useState("");
  const router = useRouter();
  const { user } = useUser();
  const { setSidebarOpen } = useGlobalStore();
  const pathname = usePathname();

  const allUsers = useQuery(api.users.getAllUsers, {
    currentClerkId,
  });

  const filtered = (allUsers ?? []).filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()),
  );

  usePresence(currentClerkId);
  const allPresence = useQuery(api.presence.getAllPresence) ?? [];
  const isOnline = (clerkId: string) => {
    const record = allPresence.find((p) => p.clerkId === clerkId);
    if (!record) return false;
    return record.isOnline && Date.now() - record.lastSeen < 20000;
  };

  const conversations = useQuery(api.conversations.getUserConversations, {
    currentUserId: currentClerkId,
  });

  return (
    <aside className="w-full md:w-60 lg:w-72 border-r-2 border-slate-200 dark:border-slate-800 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 h-16 border-b-2 border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <span className="font-bold text-lg">Messages</span>
        <UserButton afterSignOutUrl="/login" />
      </div>

      {/* Search */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800">
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 dark:border-slate-800 bg-background focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
      </div>

      {/* User list */}
      <div className="flex-1 overflow-y-auto">
        {/* All Users section */}
        <div className="p-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
            All Users
          </p>
          {filtered === undefined ? (
            <p className="text-xs text-muted-foreground px-1">Loading...</p>
          ) : filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground px-1">No users found</p>
          ) : (
            filtered.map((u) => {
              const conversation = (conversations ?? []).find(
                (c) =>
                  c.participantIds.includes(u.clerkId) &&
                  c.participantIds.includes(currentClerkId),
              );
              return (
                <div key={u._id} className="flex items-center relative">
                  <UserRow
                    name={u.name}
                    imageUrl={u.imageUrl}
                    active={pathname === `/chat/${u.clerkId}`}
                    online={isOnline(u.clerkId)}
                    onClick={() => {
                      router.push(`/chat/${u.clerkId}`);
                      setSidebarOpen(false);
                    }}
                  />
                  {conversation && (
                    <div className="pr-2 absolute right-1">
                      <UnreadBadge
                        clerkId={currentClerkId}
                        conversationId={conversation._id}
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Current user info */}
      <div className="p-4 border-t-2 border-slate-200 dark:border-slate-800 hidden md:flex items-center gap-3">
        {user?.imageUrl && (
          <img
            src={user.imageUrl}
            alt="avatar"
            className="w-8 h-8 rounded-full object-cover"
          />
        )}
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-medium truncate">{user?.fullName}</span>
          <span className="text-xs text-muted-foreground truncate">
            {user?.primaryEmailAddress?.emailAddress}
          </span>
        </div>
      </div>
    </aside>
  );
}

function UserRow({
  name,
  imageUrl,
  onClick,
  active,
  online,
  preview,
}: {
  name: string;
  imageUrl: string;
  onClick: () => void;
  active?: boolean;
  online?: boolean;
  preview?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-2 py-2.5 rounded-md transition-colors text-left ${
        active
          ? "bg-slate-200 dark:bg-slate-700"
          : "hover:bg-slate-100 dark:hover:bg-slate-800"
      }`}
    >
      <div className="relative shrink-0">
        <img
          src={imageUrl}
          alt={name}
          className="w-9 h-9 rounded-full object-cover"
        />
        {online && (
          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-background rounded-full" />
        )}
      </div>

      <div className="flex flex-col min-w-0">
        <span className="text-sm font-medium truncate">{name}</span>
        <span className="text-xs text-muted-foreground truncate">
          {online ? "Online" : "Offline"}
        </span>
        {preview && (
          <span className="text-xs text-muted-foreground truncate">
            {preview}
          </span>
        )}
      </div>
    </button>
  );
}
