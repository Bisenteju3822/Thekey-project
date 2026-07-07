"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type FeedPost, type PaginatedResponse } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

export function useFeed(courseId: string, page: number) {
  return useQuery({
    queryKey: queryKeys.posts.feed(courseId, page),
    queryFn: () => api.getFeed(courseId, page),
  });
}

export function useSavedPosts(page: number) {
  return useQuery({
    queryKey: queryKeys.posts.saved(page),
    queryFn: () => api.getSaved(page),
  });
}

export function useCourses() {
  return useQuery({
    queryKey: queryKeys.courses.all,
    queryFn: () => api.getCourses(),
  });
}

export function useToggleSave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      postId,
      hasSaved,
    }: {
      postId: string;
      hasSaved: boolean;
    }) => {
      if (hasSaved) {
        return api.unsavePost(postId);
      }
      return api.savePost(postId);
    },
    // Optimistic update — make the toggle feel instant
    onMutate: async ({ postId, hasSaved }) => {
      // Cancel any outgoing queries that might overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ["posts"] });

      // Snapshot previous data for rollback
      const previousQueries = queryClient.getQueriesData<PaginatedResponse<FeedPost>>({
        queryKey: ["posts"],
      });

      // Optimistically update all post lists
      queryClient.setQueriesData<PaginatedResponse<FeedPost>>(
        { queryKey: ["posts"] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((post) =>
              post.id === postId
                ? {
                    ...post,
                    hasSaved: !hasSaved,
                    savesCount: hasSaved
                      ? Math.max(0, post.savesCount - 1)
                      : post.savesCount + 1,
                  }
                : post
            ),
          };
        }
      );

      return { previousQueries };
    },
    onError: (_err, _vars, context) => {
      // Rollback on error
      if (context?.previousQueries) {
        for (const [key, data] of context.previousQueries) {
          queryClient.setQueryData(key, data);
        }
      }
    },
    onSettled: () => {
      // Refetch to ensure server state is accurate
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}
