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

import {
  getUserRating,
  getAverageRating,
  getAverageRatingsForCourses,
  canUserRate,
  submitRating,
} from "./ratingService";

function createModuleWithLessons(
  courseId: number,
  lessonCount: number,
) {
  const mod = testDb
    .insert(schema.modules)
    .values({ courseId, title: "Module 1", position: 1 })
    .returning()
    .get();

  const createdLessons = [];
  for (let i = 0; i < lessonCount; i++) {
    const lesson = testDb
      .insert(schema.lessons)
      .values({ moduleId: mod.id, title: `Lesson ${i + 1}`, position: i + 1 })
      .returning()
      .get();
    createdLessons.push(lesson);
  }
  return { mod, lessons: createdLessons };
}

function enrollAndPurchase(userId: number, courseId: number) {
  testDb
    .insert(schema.enrollments)
    .values({ userId, courseId })
    .run();
  testDb
    .insert(schema.purchases)
    .values({ userId, courseId, pricePaid: 1000 })
    .run();
}

function completeLessons(
  userId: number,
  lessonIds: number[],
) {
  for (const lessonId of lessonIds) {
    testDb
      .insert(schema.lessonProgress)
      .values({
        userId,
        lessonId,
        status: schema.LessonProgressStatus.Completed,
        completedAt: new Date().toISOString(),
      })
      .run();
  }
}

beforeEach(() => {
  testDb = createTestDb();
  base = seedBaseData(testDb);
});

describe("canUserRate", () => {
  it("rejects non-student users", () => {
    const result = canUserRate(base.instructor.id, base.course.id);
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/only students/i);
  });

  it("rejects users not enrolled in the course", () => {
    const result = canUserRate(base.user.id, base.course.id);
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/enrolled/i);
  });

  it("rejects users who haven't purchased the course", () => {
    testDb
      .insert(schema.enrollments)
      .values({ userId: base.user.id, courseId: base.course.id })
      .run();

    const result = canUserRate(base.user.id, base.course.id);
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/purchased/i);
  });

  it("rejects users with 50% or less progress", () => {
    enrollAndPurchase(base.user.id, base.course.id);
    const { lessons } = createModuleWithLessons(base.course.id, 4);
    // Complete exactly 2 of 4 = 50%
    completeLessons(base.user.id, [lessons[0].id, lessons[1].id]);

    const result = canUserRate(base.user.id, base.course.id);
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/50%/);
  });

  it("allows students with >50% progress who purchased", () => {
    enrollAndPurchase(base.user.id, base.course.id);
    const { lessons } = createModuleWithLessons(base.course.id, 4);
    // Complete 3 of 4 = 75%
    completeLessons(base.user.id, [
      lessons[0].id,
      lessons[1].id,
      lessons[2].id,
    ]);

    const result = canUserRate(base.user.id, base.course.id);
    expect(result.allowed).toBe(true);
  });
});

describe("submitRating", () => {
  function setupEligibleUser() {
    enrollAndPurchase(base.user.id, base.course.id);
    const { lessons } = createModuleWithLessons(base.course.id, 4);
    completeLessons(base.user.id, [
      lessons[0].id,
      lessons[1].id,
      lessons[2].id,
    ]);
  }

  it("creates a new rating", () => {
    setupEligibleUser();
    const result = submitRating(base.user.id, base.course.id, 4);
    expect(result.rating).toBe(4);
    expect(result.userId).toBe(base.user.id);
    expect(result.courseId).toBe(base.course.id);
  });

  it("updates an existing rating", () => {
    setupEligibleUser();
    submitRating(base.user.id, base.course.id, 3);
    const updated = submitRating(base.user.id, base.course.id, 5);
    expect(updated.rating).toBe(5);

    // Verify only one rating exists
    const rating = getUserRating(base.user.id, base.course.id);
    expect(rating?.rating).toBe(5);
  });

  it("rejects invalid rating values", () => {
    setupEligibleUser();
    expect(() => submitRating(base.user.id, base.course.id, 0)).toThrow();
    expect(() => submitRating(base.user.id, base.course.id, 6)).toThrow();
    expect(() => submitRating(base.user.id, base.course.id, 3.5)).toThrow();
  });

  it("rejects ineligible users", () => {
    expect(() => submitRating(base.user.id, base.course.id, 4)).toThrow(
      /enrolled/i,
    );
  });
});

describe("getAverageRating", () => {
  it("returns 0 for courses with no ratings", () => {
    const result = getAverageRating(base.course.id);
    expect(result.average).toBe(0);
    expect(result.count).toBe(0);
  });

  it("calculates average correctly", () => {
    const u2 = testDb
      .insert(schema.users)
      .values({ name: "U2", email: "u2@test.com", role: schema.UserRole.Student })
      .returning()
      .get();
    const u3 = testDb
      .insert(schema.users)
      .values({ name: "U3", email: "u3@test.com", role: schema.UserRole.Student })
      .returning()
      .get();

    testDb
      .insert(schema.courseRatings)
      .values([
        { userId: base.user.id, courseId: base.course.id, rating: 4 },
        { userId: u2.id, courseId: base.course.id, rating: 5 },
        { userId: u3.id, courseId: base.course.id, rating: 3 },
      ])
      .run();

    const result = getAverageRating(base.course.id);
    expect(result.average).toBe(4);
    expect(result.count).toBe(3);
  });
});

describe("getAverageRatingsForCourses", () => {
  it("returns empty object for empty input", () => {
    expect(getAverageRatingsForCourses([])).toEqual({});
  });

  it("returns ratings grouped by course", () => {
    const u2 = testDb
      .insert(schema.users)
      .values({ name: "U2", email: "u2@test.com", role: schema.UserRole.Student })
      .returning()
      .get();

    testDb
      .insert(schema.courseRatings)
      .values([
        { userId: base.user.id, courseId: base.course.id, rating: 5 },
        { userId: u2.id, courseId: base.course.id, rating: 3 },
      ])
      .run();

    const result = getAverageRatingsForCourses([base.course.id]);
    expect(result[base.course.id].average).toBe(4);
    expect(result[base.course.id].count).toBe(2);
  });
});

describe("getUserRating", () => {
  it("returns undefined when no rating exists", () => {
    expect(getUserRating(base.user.id, base.course.id)).toBeUndefined();
  });

  it("returns the user's rating", () => {
    testDb
      .insert(schema.courseRatings)
      .values({ userId: base.user.id, courseId: base.course.id, rating: 4 })
      .run();

    const result = getUserRating(base.user.id, base.course.id);
    expect(result?.rating).toBe(4);
  });
});
