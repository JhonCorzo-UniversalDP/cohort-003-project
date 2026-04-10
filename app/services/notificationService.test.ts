import { describe, it, expect, beforeEach, vi } from "vitest";
import { createTestDb, seedBaseData } from "~/test/setup";
import * as schema from "~/db/schema";

let testDb: ReturnType<typeof createTestDb>;
let base: ReturnType<typeof seedBaseData>;

vi.mock("~/db", () => ({
  get db() {
    return testDb;
  },
}));

// Import after mock so the module picks up our test db
import {
  createNotification,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from "./notificationService";

describe("notificationService", () => {
  beforeEach(() => {
    testDb = createTestDb();
    base = seedBaseData(testDb);
  });

  describe("createNotification", () => {
    it("creates a notification with all fields", () => {
      const notification = createNotification(
        base.instructor.id,
        schema.NotificationType.Enrollment,
        "New Enrollment",
        "Test User enrolled in Test Course",
        "/instructor/1/students"
      );

      expect(notification).toBeDefined();
      expect(notification.recipientUserId).toBe(base.instructor.id);
      expect(notification.type).toBe(schema.NotificationType.Enrollment);
      expect(notification.title).toBe("New Enrollment");
      expect(notification.message).toBe("Test User enrolled in Test Course");
      expect(notification.linkUrl).toBe("/instructor/1/students");
      expect(notification.isRead).toBe(false);
      expect(notification.createdAt).toBeDefined();
    });
  });

  describe("getNotifications", () => {
    it("returns notifications for a user ordered newest first", () => {
      createNotification(
        base.instructor.id,
        schema.NotificationType.Enrollment,
        "First",
        "First notification",
        "/link/1"
      );
      createNotification(
        base.instructor.id,
        schema.NotificationType.Enrollment,
        "Second",
        "Second notification",
        "/link/2"
      );

      const notifications = getNotifications(base.instructor.id, 10, 0);
      expect(notifications).toHaveLength(2);
      // Most recent first
      expect(notifications[0].title).toBe("Second");
      expect(notifications[1].title).toBe("First");
    });

    it("respects the limit parameter", () => {
      createNotification(
        base.instructor.id,
        schema.NotificationType.Enrollment,
        "N1",
        "msg",
        "/l"
      );
      createNotification(
        base.instructor.id,
        schema.NotificationType.Enrollment,
        "N2",
        "msg",
        "/l"
      );
      createNotification(
        base.instructor.id,
        schema.NotificationType.Enrollment,
        "N3",
        "msg",
        "/l"
      );

      const notifications = getNotifications(base.instructor.id, 2, 0);
      expect(notifications).toHaveLength(2);
    });

    it("respects the offset parameter", () => {
      createNotification(
        base.instructor.id,
        schema.NotificationType.Enrollment,
        "N1",
        "msg",
        "/l"
      );
      createNotification(
        base.instructor.id,
        schema.NotificationType.Enrollment,
        "N2",
        "msg",
        "/l"
      );
      createNotification(
        base.instructor.id,
        schema.NotificationType.Enrollment,
        "N3",
        "msg",
        "/l"
      );

      const notifications = getNotifications(base.instructor.id, 10, 2);
      expect(notifications).toHaveLength(1);
    });

    it("returns empty array when user has no notifications", () => {
      expect(getNotifications(base.instructor.id, 10, 0)).toHaveLength(0);
    });

    it("does not return notifications for other users", () => {
      createNotification(
        base.user.id,
        schema.NotificationType.Enrollment,
        "For Student",
        "msg",
        "/l"
      );

      expect(getNotifications(base.instructor.id, 10, 0)).toHaveLength(0);
    });
  });

  describe("getUnreadCount", () => {
    it("returns the count of unread notifications", () => {
      createNotification(
        base.instructor.id,
        schema.NotificationType.Enrollment,
        "N1",
        "msg",
        "/l"
      );
      createNotification(
        base.instructor.id,
        schema.NotificationType.Enrollment,
        "N2",
        "msg",
        "/l"
      );

      expect(getUnreadCount(base.instructor.id)).toBe(2);
    });

    it("returns 0 when all notifications are read", () => {
      const n = createNotification(
        base.instructor.id,
        schema.NotificationType.Enrollment,
        "N1",
        "msg",
        "/l"
      );
      markAsRead(n.id);

      expect(getUnreadCount(base.instructor.id)).toBe(0);
    });

    it("returns 0 when user has no notifications", () => {
      expect(getUnreadCount(base.instructor.id)).toBe(0);
    });

    it("only counts unread notifications for the specified user", () => {
      createNotification(
        base.user.id,
        schema.NotificationType.Enrollment,
        "For Student",
        "msg",
        "/l"
      );

      expect(getUnreadCount(base.instructor.id)).toBe(0);
    });
  });

  describe("markAsRead", () => {
    it("marks a notification as read", () => {
      const notification = createNotification(
        base.instructor.id,
        schema.NotificationType.Enrollment,
        "N1",
        "msg",
        "/l"
      );
      expect(notification.isRead).toBe(false);

      const updated = markAsRead(notification.id);
      expect(updated).toBeDefined();
      expect(updated!.isRead).toBe(true);
    });

    it("does not affect other notifications", () => {
      const n1 = createNotification(
        base.instructor.id,
        schema.NotificationType.Enrollment,
        "N1",
        "msg",
        "/l"
      );
      const n2 = createNotification(
        base.instructor.id,
        schema.NotificationType.Enrollment,
        "N2",
        "msg",
        "/l"
      );

      markAsRead(n1.id);

      const remaining = getNotifications(base.instructor.id, 10, 0);
      const n2Updated = remaining.find((n) => n.id === n2.id);
      expect(n2Updated!.isRead).toBe(false);
      expect(getUnreadCount(base.instructor.id)).toBe(1);
    });
  });

  describe("markAllAsRead", () => {
    it("marks all notifications as read for a user", () => {
      createNotification(
        base.instructor.id,
        schema.NotificationType.Enrollment,
        "N1",
        "msg",
        "/l"
      );
      createNotification(
        base.instructor.id,
        schema.NotificationType.Enrollment,
        "N2",
        "msg",
        "/l"
      );

      markAllAsRead(base.instructor.id);

      expect(getUnreadCount(base.instructor.id)).toBe(0);
    });

    it("does not affect other users' notifications", () => {
      createNotification(
        base.user.id,
        schema.NotificationType.Enrollment,
        "For Student",
        "msg",
        "/l"
      );

      markAllAsRead(base.instructor.id);

      expect(getUnreadCount(base.user.id)).toBe(1);
    });

    it("returns the updated notifications", () => {
      createNotification(
        base.instructor.id,
        schema.NotificationType.Enrollment,
        "N1",
        "msg",
        "/l"
      );

      const updated = markAllAsRead(base.instructor.id);
      expect(updated).toHaveLength(1);
      expect(updated[0].isRead).toBe(true);
    });
  });
});
