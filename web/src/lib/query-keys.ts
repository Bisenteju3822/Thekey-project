// Query key factory — centralizes all cache keys for React Query
export const queryKeys = {
  courses: {
    all: ["courses"] as const,
  },
  posts: {
    feed: (courseId: string, page: number) =>
      ["posts", "feed", courseId, page] as const,
    saved: (page: number) => ["posts", "saved", page] as const,
  },
} as const;
