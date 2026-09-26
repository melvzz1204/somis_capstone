import { useCallback, useEffect, useState } from "react";
import API from "../api/axios";
import { realtimeSocket } from "../api/socket";

// Shared "new meeting" notification state. The count refreshes on mount and
// whenever any meeting write is broadcast, so badges clear within moments of
// a member opening the meeting details.
export function useUnreadMeetings() {
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const response = await API.get("/meetings/unread-count");
      const count = Number(
        response?.count ?? response?.data ?? 0,
      );
      setUnreadCount(Number.isFinite(count) ? count : 0);
    } catch {
      // A badge must never break the dashboard; keep the last known count.
    }
  }, []);

  useEffect(() => {
    refresh();
    const handleDataUpdated = (payload) => {
      if (!payload || payload.resource === "meetings") refresh();
    };
    realtimeSocket.on("data-updated", handleDataUpdated);
    return () => {
      realtimeSocket.off("data-updated", handleDataUpdated);
    };
  }, [refresh]);

  const markViewed = useCallback(
    async (meetingId) => {
      if (!meetingId) return;
      try {
        await API.patch(`/meetings/${meetingId}/view`);
      } catch {
        // Viewing the details already succeeded for the member; a retry
        // happens naturally on the next refresh.
      } finally {
        refresh();
      }
    },
    [refresh],
  );

  return { unreadCount, refresh, markViewed };
}
