"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { usePathname } from "next/navigation";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const { user } = useUser();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar currentClerkId={user?.id ?? ""} />
      <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
    </div>
  );
}

function Sidebar({ currentClerkId }: { currentClerkId: string }) {
  const [search, setSearch] = useState("");
  const router = useRouter();
  const { user } = useUser();

  const allUsers = useQuery(api.users.getAllUsers, {
    currentClerkId,
  });

  const conversations = useQuery(api.conversations.getUserConversations, {
    currentUserId: currentClerkId,
  });

  const filtered = (allUsers ?? []).filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase())
  );
  const pathname = usePathname();


  return (
    <aside className="w-72 border-r-2 border-slate-200 dark:border-slate-800 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b-2 border-slate-200 dark:border-slate-800 flex items-center justify-between">
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
            filtered.map((u) => (
             <UserRow
  key={u._id}
  name={u.name}
  imageUrl={u.imageUrl}
  active={pathname === `/chat/${u.clerkId}`}
  onClick={() => router.push(`/chat/${u.clerkId}`)}
/>
            ))
          )}
        </div>
      </div>

      {/* Current user info */}
      <div className="p-4 border-t-2 border-slate-200 dark:border-slate-800 flex items-center gap-3">
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
  preview,
}: {
  name: string;
  imageUrl: string;
  onClick: () => void;
  active?: boolean;
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
      <img
        src={imageUrl}
        alt={name}
        className="w-9 h-9 rounded-full object-cover flex-shrink-0"
      />
      <div className="flex flex-col min-w-0">
        <span className="text-sm font-medium truncate">{name}</span>
        {preview && (
          <span className="text-xs text-muted-foreground truncate">{preview}</span>
        )}
      </div>
    </button>
  );
}