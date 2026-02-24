"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect } from "react";

export function usePresence(clerkId: string) {
  const updatePresence = useMutation(api.presence.updatePresence);
  const setOffline = useMutation(api.presence.setOffline);

  useEffect(() => {
    if (!clerkId) return;

    // Mark online immediately
    updatePresence({ clerkId });

    // Ping every 10 seconds
    const interval = setInterval(() => {
      updatePresence({ clerkId });
    }, 10000);

    // Mark offline when tab closes
    const handleOffline = () => setOffline({ clerkId });
    window.addEventListener("beforeunload", handleOffline);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        setOffline({ clerkId });
      } else {
        updatePresence({ clerkId });
      }
    });

    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", handleOffline);
      setOffline({ clerkId });
    };
  }, [clerkId]);
}