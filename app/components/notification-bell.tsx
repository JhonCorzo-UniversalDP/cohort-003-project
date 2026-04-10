import { useState, useRef, useEffect } from "react";
import { useNavigate, useFetcher } from "react-router";
import { Bell } from "lucide-react";
import { cn } from "~/lib/utils";

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  linkUrl: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationBellProps {
  notifications: Notification[];
  unreadCount: number;
}

function timeAgo(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  if (diffMinutes > 0) return `${diffMinutes}m ago`;
  return "just now";
}

export function NotificationBell({
  notifications,
  unreadCount,
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const markReadFetcher = useFetcher();
  const markAllFetcher = useFetcher();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleNotificationClick(notification: Notification) {
    if (!notification.isRead) {
      markReadFetcher.submit(
        { notificationId: notification.id },
        {
          method: "post",
          action: "/api/notifications/mark-read",
          encType: "application/json",
        }
      );
    }
    setIsOpen(false);
    navigate(notification.linkUrl);
  }

  function handleMarkAllRead() {
    markAllFetcher.submit(
      {},
      { method: "post", action: "/api/notifications/mark-all-read" }
    );
    setIsOpen(false);
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative flex items-center justify-center rounded-md p-1 text-sidebar-foreground/50 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        title="Notifications"
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute left-full top-0 z-50 ml-2 w-80 rounded-md border border-sidebar-border bg-sidebar shadow-lg">
          <div className="flex items-center justify-between border-b border-sidebar-border px-4 py-2">
            <span className="text-sm font-semibold text-sidebar-foreground">
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-primary hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-sidebar-foreground/50">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors hover:bg-sidebar-accent",
                    !notification.isRead && "bg-sidebar-accent/30"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={cn(
                        "text-sm font-medium text-sidebar-foreground",
                        !notification.isRead && "font-semibold"
                      )}
                    >
                      {notification.title}
                    </span>
                    {!notification.isRead && (
                      <span className="mt-1 size-2 shrink-0 rounded-full bg-blue-500" />
                    )}
                  </div>
                  <span className="text-xs text-sidebar-foreground/70">
                    {notification.message}
                  </span>
                  <span className="text-xs text-sidebar-foreground/40">
                    {timeAgo(notification.createdAt)}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
