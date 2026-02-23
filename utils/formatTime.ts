export function formatMessageTime(timestamp: number): string {
  const messageDate = new Date(timestamp);
  const now = new Date();

  const isToday =
    messageDate.getDate() === now.getDate() &&
    messageDate.getMonth() === now.getMonth() &&
    messageDate.getFullYear() === now.getFullYear();

  const isThisYear = messageDate.getFullYear() === now.getFullYear();

  const timeOnly = messageDate.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isToday) {
    // 2:34 PM
    return timeOnly;
  }

  if (isThisYear) {
    // Feb 15, 2:34 PM
    return messageDate.toLocaleDateString([], {
      month: "short",
      day: "numeric",
    }) + ", " + timeOnly;
  }

  // Feb 15 2023, 2:34 PM
  return messageDate.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  }) + ", " + timeOnly;
}