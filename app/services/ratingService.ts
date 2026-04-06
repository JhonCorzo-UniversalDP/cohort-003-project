import { eq, and, sql } from "drizzle-orm";
import { db } from "~/db";
import {
  courseRatings,
  enrollments,
  users,
  UserRole,
} from "~/db/schema";
import { calculateProgress } from "./progressService";

// ─── Rating Service ───
// Handles course star ratings (1-5) for enrolled students with >50% progress.

export function getUserRating(userId: number, courseId: number) {
  return db
    .select()
    .from(courseRatings)
    .where(
      and(
        eq(courseRatings.userId, userId),
        eq(courseRatings.courseId, courseId),
      ),
    )
    .get();
}

export function getAverageRating(courseId: number) {
  const result = db
    .select({
      average: sql<number>`avg(${courseRatings.rating})`,
      count: sql<number>`count(*)`,
    })
    .from(courseRatings)
    .where(eq(courseRatings.courseId, courseId))
    .get();

  return {
    average: result?.average ? Math.round(result.average * 10) / 10 : 0,
    count: result?.count ?? 0,
  };
}

export function getAverageRatingsForCourses(courseIds: number[]) {
  if (courseIds.length === 0) return {};

  const results = db
    .select({
      courseId: courseRatings.courseId,
      average: sql<number>`avg(${courseRatings.rating})`,
      count: sql<number>`count(*)`,
    })
    .from(courseRatings)
    .groupBy(courseRatings.courseId)
    .all();

  const map: Record<
    number,
    { average: number; count: number }
  > = {};
  for (const r of results) {
    map[r.courseId] = {
      average: Math.round(r.average * 10) / 10,
      count: r.count,
    };
  }
  return map;
}

export function canUserRate(userId: number, courseId: number) {
  const user = db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .get();

  if (!user || user.role !== UserRole.Student) {
    return { allowed: false as const, reason: "Only students can rate courses" };
  }

  const enrollment = db
    .select()
    .from(enrollments)
    .where(
      and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)),
    )
    .get();

  if (!enrollment) {
    return {
      allowed: false as const,
      reason: "You must be enrolled in this course to rate it",
    };
  }

  const progress = calculateProgress(userId, courseId, false, false);
  if (progress <= 50) {
    return {
      allowed: false as const,
      reason:
        "You must complete more than 50% of the course before rating it",
    };
  }

  return { allowed: true as const };
}

export function submitRating(
  userId: number,
  courseId: number,
  rating: number,
) {
  if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
    throw new Error("Rating must be an integer between 1 and 5");
  }

  const eligibility = canUserRate(userId, courseId);
  if (!eligibility.allowed) {
    throw new Error(eligibility.reason);
  }

  const existing = getUserRating(userId, courseId);

  if (existing) {
    return db
      .update(courseRatings)
      .set({ rating, updatedAt: new Date().toISOString() })
      .where(eq(courseRatings.id, existing.id))
      .returning()
      .get();
  }

  return db
    .insert(courseRatings)
    .values({ userId, courseId, rating })
    .returning()
    .get();
}
