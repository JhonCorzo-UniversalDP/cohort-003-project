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
  getCommentsForLesson,
  getCommentById,
  createComment,
  deleteComment,
} from "./commentService";

function createModuleWithLesson(courseId: number) {
  const mod = testDb
    .insert(schema.modules)
    .values({ courseId, title: "Module 1", position: 1 })
    .returning()
    .get();
  const lesson = testDb
    .insert(schema.lessons)
    .values({ moduleId: mod.id, title: "Lesson 1", position: 1 })
    .returning()
    .get();
  return { mod, lesson };
}

describe("commentService", () => {
  beforeEach(() => {
    testDb = createTestDb();
    base = seedBaseData(testDb);
  });

  describe("getCommentsForLesson", () => {
    it("returns empty array when no comments exist", () => {
      const { lesson } = createModuleWithLesson(base.course.id);
      const comments = getCommentsForLesson(lesson.id);
      expect(comments).toEqual([]);
    });

    it("returns comments with user info ordered by createdAt", () => {
      const { lesson } = createModuleWithLesson(base.course.id);

      testDb
        .insert(schema.lessonComments)
        .values({
          lessonId: lesson.id,
          userId: base.user.id,
          content: "First comment",
          createdAt: "2026-01-01T00:00:00.000Z",
        })
        .run();
      testDb
        .insert(schema.lessonComments)
        .values({
          lessonId: lesson.id,
          userId: base.instructor.id,
          content: "Second comment",
          createdAt: "2026-01-02T00:00:00.000Z",
        })
        .run();

      const comments = getCommentsForLesson(lesson.id);
      expect(comments).toHaveLength(2);
      expect(comments[0].content).toBe("First comment");
      expect(comments[0].userName).toBe(base.user.name);
      expect(comments[1].content).toBe("Second comment");
      expect(comments[1].userName).toBe(base.instructor.name);
    });
  });

  describe("createComment", () => {
    it("inserts and returns the comment", () => {
      const { lesson } = createModuleWithLesson(base.course.id);
      const comment = createComment(
        base.user.id,
        lesson.id,
        "Hello world",
      );
      expect(comment.content).toBe("Hello world");
      expect(comment.userId).toBe(base.user.id);
      expect(comment.lessonId).toBe(lesson.id);
      expect(comment.id).toBeDefined();
    });
  });

  describe("getCommentById", () => {
    it("returns the comment when it exists", () => {
      const { lesson } = createModuleWithLesson(base.course.id);
      const created = createComment(base.user.id, lesson.id, "Test");
      const found = getCommentById(created.id);
      expect(found).toBeDefined();
      expect(found!.content).toBe("Test");
    });

    it("returns undefined for non-existent comment", () => {
      const found = getCommentById(9999);
      expect(found).toBeUndefined();
    });
  });

  describe("deleteComment", () => {
    it("removes the comment and returns it", () => {
      const { lesson } = createModuleWithLesson(base.course.id);
      const created = createComment(base.user.id, lesson.id, "To delete");
      const deleted = deleteComment(created.id);
      expect(deleted).toBeDefined();
      expect(deleted!.id).toBe(created.id);

      const remaining = getCommentsForLesson(lesson.id);
      expect(remaining).toHaveLength(0);
    });

    it("returns undefined for non-existent comment", () => {
      const deleted = deleteComment(9999);
      expect(deleted).toBeUndefined();
    });
  });
});
