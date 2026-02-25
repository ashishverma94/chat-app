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
import { Users, Plus, Search, MessageSquareMoreIcon } from "lucide-react";
import { CreateGroupModal } from "@/components/createGroupModal";
import Skeleton from "@/components/Skeleton";

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

  const allUsers = useQuery(api.users.getAllUsers, { currentClerkId });

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

  const [showGroupModal, setShowGroupModal] = useState(false);
  const groupConversations = useQuery(api.conversations.getGroupConversations, {
    currentUserId: currentClerkId,
  });

  const dmConversationIds = (conversations ?? [])
    .filter((c) => !c.isGroup)
    .map((c) => c._id);

  const groupConversationIds = (groupConversations ?? []).map((c) => c._id);
  const allConversationIds = [...groupConversationIds, ...dmConversationIds];

  const lastMessages =
    useQuery(
      api.messages.getLastMessages,
      allConversationIds.length > 0
        ? { conversationIds: allConversationIds }
        : "skip",
    ) ?? {};

  const getPreview = (conversationId: string) => {
    const msg = lastMessages[conversationId];
    if (!msg) return "No messages yet";
    if (msg.isDeleted) return "Message deleted";
    const prefix = msg.senderId === currentClerkId ? "You: " : "";
    const text =
      msg.content.length > 30 ? msg.content.slice(0, 30) + "..." : msg.content;
    return prefix + text;
  };

  // ✅ Filter both users AND groups by search term
  const filteredUsers = (allUsers ?? []).filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()),
  );

  const filteredGroups = (groupConversations ?? []).filter((g) =>
    (g.groupName ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <aside className="w-full md:w-60 lg:w-72 border-r-2 border-slate-200 dark:border-slate-800 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 h-16 border-b-2 border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex flex-row items-center gap-2">
          <MessageSquareMoreIcon />
          <span className="font-bold text-lg">Messages</span>
        </div>
        <UserButton afterSignOutUrl="/login" />
      </div>

      {/* Search */}
      <div className="p-4 relative border-b border-slate-200 dark:border-slate-800">
        <input
          type="text"
          placeholder="Search users or groups..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-3 text-sm rounded-md border border-slate-400 dark:border-slate-800 bg-background focus:outline-none focus:ring-2 focus:ring-slate-300"
        />
        <Search className="absolute top-[50%] left-6 -translate-y-[50%] text-slate-400 size-5" />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {/* Groups section */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2 px-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Groups
            </p>
            <button
              onClick={() => setShowGroupModal(true)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Create group"
            >
              <Plus size={16} />
            </button>
          </div>

          {groupConversations === undefined ? (
            <div className="flex flex-col gap-2">
              {[1, 2].map((_, i) => (
                <Skeleton key={i} height="58px" />
              ))}
            </div>
          ) : filteredGroups.length === 0 ? (
            <p className="text-xs text-muted-foreground px-1">
              {search ? `No groups matching "${search}"` : "No groups yet"}
            </p>
          ) : (
            filteredGroups.map((group) => (
              <button
                key={group._id}
                onClick={() => {
                  router.push(`/chat/${group._id}`);
                  setSidebarOpen(false);
                }}
                className={`w-full mt-1 flex items-center gap-3 px-2 py-2.5 rounded-md transition-colors text-left ${
                  pathname === `/chat/${group._id}`
                    ? "bg-slate-200 dark:bg-slate-700"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                  <Users size={16} className="text-muted-foreground" />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  {/* ✅ Highlight matching search text in group name */}
                  <span className="text-sm font-medium truncate">
                    {highlightMatch(group.groupName ?? "", search)}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    {group.participantIds.length} members ·{" "}
                    {getPreview(group._id)}
                  </span>
                </div>
                <UnreadBadge
                  clerkId={currentClerkId}
                  conversationId={group._id}
                />
              </button>
            ))
          )}
        </div>

        {/* Users section */}
        <div className="p-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
            All Users
          </p>
          {allUsers === undefined ? (
            <div className="flex flex-col gap-2 text-muted-foreground px-1">
              {[1, 2, 3, 4].map((_, i) => (
                <Skeleton key={i} height="58px" />
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <p className="text-xs text-muted-foreground px-1">
              {search ? `No users matching "${search}"` : "No users found"}
            </p>
          ) : (
            filteredUsers.map((u) => {
              const conversation = (conversations ?? []).find(
                (c) =>
                  !c.isGroup &&
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
                    search={search}
                    onClick={() => {
                      router.push(`/chat/${u.clerkId}`);
                      setSidebarOpen(false);
                    }}
                    preview={
                      conversation ? getPreview(conversation._id) : undefined
                    }
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

      {/* Current user footer */}
      <div className="p-4 h-20 border-t-2 border-slate-200 dark:border-slate-800 hidden md:flex items-center gap-3">
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

      {showGroupModal && (
        <CreateGroupModal onClose={() => setShowGroupModal(false)} />
      )}
    </aside>
  );
}

// ✅ Highlights matching search text in yellow
function highlightMatch(text: string, search: string) {
  if (!search.trim()) return text;
  const idx = text.toLowerCase().indexOf(search.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-200 dark:bg-yellow-800 text-inherit rounded-sm">
        {text.slice(idx, idx + search.length)}
      </mark>
      {text.slice(idx + search.length)}
    </>
  );
}

function UserRow({
  name,
  imageUrl,
  onClick,
  active,
  online,
  preview,
  search = "",
}: {
  name: string;
  imageUrl: string;
  onClick: () => void;
  active?: boolean;
  online?: boolean;
  preview?: string;
  search?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full mt-1 flex items-center gap-3 px-2 py-2.5 rounded-md transition-colors text-left ${
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
        <div className="flex items-center gap-1.5">
          {/* ✅ Highlight matching name */}
          <span className="text-sm font-medium truncate">
            {highlightMatch(name, search)}
          </span>
          {online && (
            <span className="text-[10px] text-green-500 font-medium shrink-0">
              ● Online
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground truncate">
          {preview ?? (online ? "Online" : "Offline")}
        </span>
      </div>
    </button>
  );
}
