"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { PostCard } from "@/components/PostCard";
import { Pagination } from "@/components/Pagination";
import { useFeed, useToggleSave } from "@/hooks/use-posts";
import { useTranslation } from "@/app/providers";

export default function FeedPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useFeed(courseId, page);
  const toggleSave = useToggleSave();

  const handleToggle = (postId: string, hasSaved: boolean) => {
    toggleSave.mutate({ postId, hasSaved });
  };

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">{t("feed.title")}</h1>

        {isLoading && (
          <p className="text-gray-500 text-center py-12">{t("common.loading")}</p>
        )}

        {error && (
          <div className="text-center py-12">
            <p className="text-red-500 mb-2">{error.message}</p>
          </div>
        )}

        {data && data.data.length === 0 && (
          <p className="text-gray-400 text-center py-12">{t("feed.empty")}</p>
        )}

        <div className="space-y-4">
          {data?.data.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onToggleSave={handleToggle}
              isPending={toggleSave.isPending}
            />
          ))}
        </div>

        {data && (
          <Pagination
            page={page}
            totalPages={data.pagination.totalPages}
            onPageChange={setPage}
          />
        )}
      </main>
    </>
  );
}
