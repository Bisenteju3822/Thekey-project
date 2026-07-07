"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { PostCard } from "@/components/PostCard";
import { Pagination } from "@/components/Pagination";
import { useSavedPosts, useToggleSave } from "@/hooks/use-posts";
import { useTranslation } from "@/app/providers";

export default function SavedPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useSavedPosts(page);
  const toggleSave = useToggleSave();

  const handleToggle = (postId: string, hasSaved: boolean) => {
    toggleSave.mutate({ postId, hasSaved });
  };

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">{t("saved.title")}</h1>

        {isLoading && (
          <p className="text-gray-500 text-center py-12">{t("common.loading")}</p>
        )}

        {error && (
          <p className="text-red-500 text-center py-12">{t("common.error")}</p>
        )}

        {data && data.data.length === 0 && (
          <div className="text-center py-16">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-12 h-12 text-gray-300 mx-auto mb-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0z"
              />
            </svg>
            <p className="text-gray-500 font-medium mb-1">{t("saved.empty")}</p>
            <p className="text-gray-400 text-sm">{t("saved.emptyHint")}</p>
          </div>
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
