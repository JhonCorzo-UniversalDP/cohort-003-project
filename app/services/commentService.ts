import { eq, asc } from "drizzle-orm";
import { db } from "~/db";
import { lessonComments, users } from "~/db/schema";

export function getCommentsForLesson(lessonId: number) {
  return db
    .select({
      id: lessonComments.id,
      content: lessonComments.content,
      createdAt: lessonComments.createdAt,
      userId: lessonComments.userId,
      userName: users.name,
      userAvatarUrl: users.avatarUrl,
    })
    .from(lessonComments)
    .innerJoin(users, eq(lessonComments.userId, users.id))
    .where(eq(lessonComments.lessonId, lessonId))
    .orderBy(asc(lessonComments.createdAt))
    .all();
}

export function getCommentById(commentId: number) {
  return db
    .select()
    .from(lessonComments)
    .where(eq(lessonComments.id, commentId))
    .get();
}

export function createComment(
  userId: number,
  lessonId: number,
  content: string,
) {
  return db
    .insert(lessonComments)
    .values({ userId, lessonId, content })
    .returning()
    .get();
}

export function deleteComment(commentId: number) {
  return db
    .delete(lessonComments)
    .where(eq(lessonComments.id, commentId))
    .returning()
    .get();
}
