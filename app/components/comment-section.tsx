import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { UserAvatar } from "~/components/user-avatar";
import { MessageSquare, Trash2 } from "lucide-react";

type Comment = {
  id: number;
  content: string;
  createdAt: string;
  userId: number;
  userName: string;
  userAvatarUrl: string | null;
};

type CommentSectionProps = {
  comments: Comment[];
  currentUserId: number | null;
  currentUserRole: string | null;
  courseInstructorId: number;
  enrolled: boolean;
};

function formatRelativeTime(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffSeconds = Math.floor((now - then) / 1000);

  if (diffSeconds < 60) return "just now";
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60)
    return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24)
    return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30)
    return `${diffDays}d ago`;
  return new Date(isoString).toLocaleDateString();
}

function CommentItem({
  comment,
  canDelete,
}: {
  comment: Comment;
  canDelete: boolean;
}) {
  const fetcher = useFetcher({ key: `delete-comment-${comment.id}` });
  const isDeleting = fetcher.state !== "idle";

  if (isDeleting) return null;

  return (
    <div className="flex gap-3 py-4">
      <UserAvatar
        name={comment.userName}
        avatarUrl={comment.userAvatarUrl}
        className="mt-0.5 shrink-0"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{comment.userName}</span>
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(comment.createdAt)}
          </span>
        </div>
        <p className="mt-1 whitespace-pre-wrap text-sm">{comment.content}</p>
      </div>
      {canDelete && (
        <fetcher.Form method="post">
          <input type="hidden" name="intent" value="delete-comment" />
          <input type="hidden" name="commentId" value={comment.id} />
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </Button>
        </fetcher.Form>
      )}
    </div>
  );
}

export function CommentSection({
  comments,
  currentUserId,
  currentUserRole,
  courseInstructorId,
  enrolled,
}: CommentSectionProps) {
  const fetcher = useFetcher({ key: "create-comment" });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [content, setContent] = useState("");
  const isSubmitting =
    fetcher.state !== "idle" &&
    fetcher.formData?.get("intent") === "create-comment";

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.success) {
      setContent("");
    }
  }, [fetcher.state, fetcher.data]);

  const canModerate =
    currentUserRole === "admin" || currentUserId === courseInstructorId;

  return (
    <section className="mt-8 border-t pt-6">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <MessageSquare className="size-5" />
        Comments ({comments.length})
      </h2>

      {currentUserId && (enrolled || canModerate) && (
        <fetcher.Form method="post" className="mt-4">
          <input type="hidden" name="intent" value="create-comment" />
          <Textarea
            ref={textareaRef}
            name="content"
            placeholder="Add a comment..."
            maxLength={2000}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[80px] resize-y"
          />
          <div className="mt-2 flex justify-end">
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || content.trim().length === 0}
            >
              {isSubmitting ? "Posting..." : "Post Comment"}
            </Button>
          </div>
        </fetcher.Form>
      )}

      <div className="mt-4 divide-y">
        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            canDelete={
              currentUserId === comment.userId || canModerate
            }
          />
        ))}
      </div>

      {comments.length === 0 && (
        <p className="mt-4 text-sm text-muted-foreground">
          No comments yet. Be the first to comment!
        </p>
      )}
    </section>
  );
}
