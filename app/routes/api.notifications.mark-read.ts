import { data } from "react-router";
import type { Route } from "./+types/api.notifications.mark-read";
import { getCurrentUserId } from "~/lib/session";
import { markAsRead } from "~/services/notificationService";
import { db } from "~/db";
import { notifications } from "~/db/schema";
import { eq } from "drizzle-orm";

export async function action({ request }: Route.ActionArgs) {
  const userId = await getCurrentUserId(request);
  if (!userId) {
    return data({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const notificationId = Number(body.notificationId);
  if (!notificationId) {
    return data({ error: "Missing notificationId" }, { status: 400 });
  }

  // Ensure the notification belongs to the current user
  const notification = db
    .select()
    .from(notifications)
    .where(eq(notifications.id, notificationId))
    .get();

  if (!notification || notification.recipientUserId !== userId) {
    return data({ error: "Not found" }, { status: 404 });
  }

  const updated = markAsRead(notificationId);
  return { notification: updated };
}
