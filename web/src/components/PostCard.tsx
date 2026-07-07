"use client";

import { useTranslation } from "@/app/providers";
import { BookmarkButton } from "./BookmarkButton";
import type { FeedPost } from "@/lib/api-client";

interface PostCardProps {
  post: FeedPost;
  onToggleSave: (postId: string, hasSaved: boolean) => void;
  isPending?: boolean;
}

export function PostCard({ post, onToggleSave, isPending }: PostCardProps) {
  const { t } = useTranslation();

  const date = new Date(post.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <article className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-sm transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 mb-1">
            {post.title}
          </h3>
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{post.body}</p>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span>
              {t("feed.by")} <strong className="text-gray-600">{post.authorName}</strong>
            </span>
            <span>{date}</span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1 ml-4 shrink-0">
          <BookmarkButton
            hasSaved={post.hasSaved}
            onClick={() => onToggleSave(post.id, post.hasSaved)}
            disabled={isPending}
          />
          <span className="text-xs text-gray-400">
            {t("post.savesCount", { count: post.savesCount })}
          </span>
        </div>
      </div>
    </article>
  );
}
