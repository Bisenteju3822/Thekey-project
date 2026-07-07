export interface FeedPost {
  id: string;
  courseId: string;
  authorId: string;
  authorName: string;
  title: string;
  body: string;
  createdAt: string;
  hasSaved: boolean;
  savesCount: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Course {
  id: string;
  title: string;
  description: string;
}

let currentUser = { userId: "user-1", role: "student" };

export function setCurrentUser(userId: string, role: string) {
  currentUser = { userId, role };
}

export function getCurrentUser() {
  return currentUser;
}

function authHeaders(): Record<string, string> {
  return {
    "x-user-id": currentUser.userId,
    "x-user-role": currentUser.role,
    "Content-Type": "application/json",
  };
}

const BASE = "/api";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  getCourses: () =>
    fetch(`${BASE}/courses`, { headers: authHeaders() })
      .then((r) => handleResponse<{ data: Course[] }>(r))
      .then((r) => r.data),

  getFeed: (courseId: string, page = 1, limit = 10) =>
    fetch(`${BASE}/courses/${courseId}/posts?page=${page}&limit=${limit}`, {
      headers: authHeaders(),
    }).then((r) => handleResponse<PaginatedResponse<FeedPost>>(r)),

  savePost: (postId: string) =>
    fetch(`${BASE}/posts/${postId}/save`, {
      method: "POST",
      headers: authHeaders(),
    }).then((r) => handleResponse<{ success: boolean }>(r)),

  unsavePost: (postId: string) =>
    fetch(`${BASE}/posts/${postId}/save`, {
      method: "DELETE",
      headers: authHeaders(),
    }).then((r) => handleResponse<{ success: boolean }>(r)),

  getSaved: (page = 1, limit = 10) =>
    fetch(`${BASE}/saved?page=${page}&limit=${limit}`, {
      headers: authHeaders(),
    }).then((r) => handleResponse<PaginatedResponse<FeedPost>>(r)),

  deletePost: (courseId: string, postId: string) =>
    fetch(`${BASE}/courses/${courseId}/posts/${postId}`, {
      method: "DELETE",
      headers: authHeaders(),
    }).then((r) => handleResponse<{ success: boolean }>(r)),
};
