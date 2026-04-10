import { data } from "react-router";
import type { Route } from "./+types/api.notifications.mark-all-read";
import { getCurrentUserId } from "~/lib/session";
import { markAllAsRead } from "~/services/notificationService";

export async function action({ request }: Route.ActionArgs) {
  const userId = await getCurrentUserId(request);
  if (!userId) {
    return data({ error: "Unauthorized" }, { status: 401 });
  }

  const updated = markAllAsRead(userId);
  return { notifications: updated };
}
