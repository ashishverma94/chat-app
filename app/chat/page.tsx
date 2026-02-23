export default function ChatPage() {
  return (
    <div className="flex flex-1 items-center justify-center h-full">
      <div className="text-center flex flex-col gap-2">
        <p className="text-2xl font-bold">👋 Welcome to Chat</p>
        <p className="text-sm text-muted-foreground">
          Select a user from the sidebar to start a conversation
        </p>
      </div>
    </div>
  );
}