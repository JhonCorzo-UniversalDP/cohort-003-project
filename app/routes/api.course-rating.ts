import { data } from "react-router";
import { z } from "zod";
import type { Route } from "./+types/api.course-rating";
import { getCurrentUserId } from "~/lib/session";
import { submitRating } from "~/services/ratingService";
import { parseJsonBody } from "~/lib/validation";

const ratingSchema = z.object({
  courseId: z.number(),
  rating: z.number().int().min(1).max(5),
});

export async function action({ request }: Route.ActionArgs) {
  const currentUserId = await getCurrentUserId(request);
  if (!currentUserId) {
    throw data("Unauthorized", { status: 401 });
  }

  const parsed = await parseJsonBody(request, ratingSchema);

  if (!parsed.success) {
    throw data("Invalid parameters", { status: 400 });
  }

  const { courseId, rating } = parsed.data;

  try {
    const result = submitRating(currentUserId, courseId, rating);
    return { success: true, rating: result };
  } catch (error) {
    throw data(
      error instanceof Error ? error.message : "Failed to submit rating",
      { status: 403 },
    );
  }
}
