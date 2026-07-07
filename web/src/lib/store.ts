// In-memory data store for Vercel deployment
// (Local dev uses the Elysia + SQLite server instead)

export interface User {
  id: string;
  name: string;
  role: "student" | "moderator";
}

export interface Course {
  id: string;
  title: string;
  description: string;
}

export interface Post {
  id: string;
  courseId: string;
  authorId: string;
  title: string;
  body: string;
  createdAt: string;
  deletedAt: string | null;
}

export interface SavedPost {
  id: string;
  userId: string;
  postId: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

const users: User[] = [
  { id: "user-1", name: "Alice Johnson", role: "student" },
  { id: "user-2", name: "Bob Smith", role: "student" },
  { id: "user-3", name: "Carlos Garcia", role: "student" },
  { id: "user-4", name: "Diana Lee", role: "student" },
  { id: "user-5", name: "Mod Emily", role: "moderator" },
];

const courses: Course[] = [
  { id: "course-1", title: "Introduction to React", description: "Learn the fundamentals of React including components, hooks, and state management." },
  { id: "course-2", title: "Advanced Node.js", description: "Deep dive into Node.js patterns, streams, performance, and production best practices." },
];

const enrollments = [
  { userId: "user-1", courseId: "course-1" },
  { userId: "user-2", courseId: "course-1" },
  { userId: "user-2", courseId: "course-2" },
  { userId: "user-3", courseId: "course-2" },
  { userId: "user-4", courseId: "course-1" },
];

const posts: Post[] = [
  { id: "post-1", courseId: "course-1", authorId: "user-1", title: "What is the virtual DOM?", body: "Can someone explain how the virtual DOM works in React and why it matters for performance?", createdAt: "2025-07-01T10:00:00Z", deletedAt: null },
  { id: "post-2", courseId: "course-1", authorId: "user-2", title: "useState vs useReducer", body: "When should I use useReducer instead of useState? Are there performance differences?", createdAt: "2025-07-02T11:30:00Z", deletedAt: null },
  { id: "post-3", courseId: "course-1", authorId: "user-4", title: "Best practices for useEffect", body: "I keep getting infinite loops with useEffect. What are the best practices for cleanup and dependency arrays?", createdAt: "2025-07-03T09:15:00Z", deletedAt: null },
  { id: "post-4", courseId: "course-1", authorId: "user-1", title: "React Server Components", body: "How do React Server Components differ from regular components? When should I use them?", createdAt: "2025-07-04T14:00:00Z", deletedAt: null },
  { id: "post-5", courseId: "course-1", authorId: "user-2", title: "Custom hooks patterns", body: "Share your favorite custom hook patterns! I will start: useLocalStorage for persisting state.", createdAt: "2025-07-05T16:45:00Z", deletedAt: null },
  { id: "post-6", courseId: "course-2", authorId: "user-2", title: "Understanding event loop", body: "Can someone break down how the Node.js event loop processes different types of callbacks?", createdAt: "2025-07-01T08:00:00Z", deletedAt: null },
  { id: "post-7", courseId: "course-2", authorId: "user-3", title: "Stream vs Buffer", body: "When should I use streams instead of reading entire files into buffers?", createdAt: "2025-07-02T13:20:00Z", deletedAt: null },
  { id: "post-8", courseId: "course-2", authorId: "user-3", title: "Worker threads for CPU tasks", body: "Has anyone used worker_threads for CPU-intensive tasks? How does it compare to child_process?", createdAt: "2025-07-03T10:45:00Z", deletedAt: null },
  { id: "post-9", courseId: "course-2", authorId: "user-2", title: "Error handling patterns", body: "What is your preferred error handling pattern in Express/Fastify? Global handler vs per-route?", createdAt: "2025-07-04T15:30:00Z", deletedAt: null },
];

const savedPosts: SavedPost[] = [
  { id: "save-1", userId: "user-1", postId: "post-2", active: true, createdAt: "2025-07-02T12:00:00Z", updatedAt: "2025-07-02T12:00:00Z" },
  { id: "save-2", userId: "user-1", postId: "post-3", active: true, createdAt: "2025-07-03T10:00:00Z", updatedAt: "2025-07-03T10:00:00Z" },
  { id: "save-3", userId: "user-2", postId: "post-1", active: true, createdAt: "2025-07-01T11:00:00Z", updatedAt: "2025-07-01T11:00:00Z" },
  { id: "save-4", userId: "user-3", postId: "post-7", active: true, createdAt: "2025-07-02T14:00:00Z", updatedAt: "2025-07-02T14:00:00Z" },
];

export const store = {
  getUser: (id: string) => users.find((u) => u.id === id),

  getCourses: (userId: string, role: string) => {
    if (role === "moderator") return courses;
    const enrolled = enrollments.filter((e) => e.userId === userId);
    return courses.filter((c) => enrolled.some((e) => e.courseId === c.id));
  },

  isEnrolled: (userId: string, courseId: string) =>
    enrollments.some((e) => e.userId === userId && e.courseId === courseId),

  getPost: (postId: string) => posts.find((p) => p.id === postId && !p.deletedAt),

  getFeed: (courseId: string, userId: string, page: number, limit: number) => {
    const coursePosts = posts
      .filter((p) => p.courseId === courseId && !p.deletedAt)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const total = coursePosts.length;
    const offset = (page - 1) * limit;
    const paginated = coursePosts.slice(offset, offset + limit);

    return {
      data: paginated.map((p) => hydrate(p, userId)),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  savePost: (userId: string, postId: string) => {
    const existing = savedPosts.find((s) => s.userId === userId && s.postId === postId);
    if (!existing) {
      savedPosts.push({
        id: `save-${Date.now()}`,
        userId,
        postId,
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return "create";
    }
    if (!existing.active) {
      existing.active = true;
      existing.updatedAt = new Date().toISOString();
      return "activate";
    }
    return "noop";
  },

  unsavePost: (userId: string, postId: string) => {
    const existing = savedPosts.find((s) => s.userId === userId && s.postId === postId);
    if (!existing || !existing.active) return "noop";
    existing.active = false;
    existing.updatedAt = new Date().toISOString();
    return "deactivate";
  },

  getSavedList: (userId: string, page: number, limit: number) => {
    const userSaves = savedPosts
      .filter((s) => s.userId === userId && s.active)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

    const total = userSaves.length;
    const offset = (page - 1) * limit;
    const paginated = userSaves.slice(offset, offset + limit);

    const hydratedPosts = paginated
      .map((s) => posts.find((p) => p.id === s.postId && !p.deletedAt))
      .filter((p): p is Post => !!p)
      .map((p) => hydrate(p, userId));

    return {
      data: hydratedPosts,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  deletePost: (postId: string) => {
    const post = posts.find((p) => p.id === postId);
    if (post) post.deletedAt = new Date().toISOString();
  },
};

function hydrate(post: Post, userId: string) {
  const saves = savedPosts.filter((s) => s.postId === post.id && s.active);
  const author = users.find((u) => u.id === post.authorId);
  return {
    id: post.id,
    courseId: post.courseId,
    authorId: post.authorId,
    authorName: author?.name ?? "Unknown",
    title: post.title,
    body: post.body,
    createdAt: post.createdAt,
    hasSaved: saves.some((s) => s.userId === userId),
    savesCount: saves.length,
  };
}
