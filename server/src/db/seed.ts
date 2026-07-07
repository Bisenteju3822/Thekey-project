import { Database } from "bun:sqlite";
import { resolve } from "path";

const dbPath = resolve(import.meta.dirname, "../../data/forum.db");
const sqlite = new Database(dbPath);
sqlite.exec("PRAGMA foreign_keys = ON;");

// Clear existing data
sqlite.exec(`
  DELETE FROM saved_posts;
  DELETE FROM posts;
  DELETE FROM enrollments;
  DELETE FROM courses;
  DELETE FROM users;
`);

// Users: 4 students + 1 moderator
sqlite.exec(`
  INSERT INTO users (id, name, role) VALUES
    ('user-1', 'Alice Johnson', 'student'),
    ('user-2', 'Bob Smith', 'student'),
    ('user-3', 'Carlos Garcia', 'student'),
    ('user-4', 'Diana Lee', 'student'),
    ('user-5', 'Mod Emily', 'moderator');
`);

// 2 Courses
sqlite.exec(`
  INSERT INTO courses (id, title, description) VALUES
    ('course-1', 'Introduction to React', 'Learn the fundamentals of React including components, hooks, and state management.'),
    ('course-2', 'Advanced Node.js', 'Deep dive into Node.js patterns, streams, performance, and production best practices.');
`);

// Enrollments
sqlite.exec(`
  INSERT INTO enrollments (user_id, course_id) VALUES
    ('user-1', 'course-1'),
    ('user-2', 'course-1'),
    ('user-2', 'course-2'),
    ('user-3', 'course-2'),
    ('user-4', 'course-1');
`);

// Posts
sqlite.exec(`
  INSERT INTO posts (id, course_id, author_id, title, body, created_at) VALUES
    ('post-1', 'course-1', 'user-1', 'What is the virtual DOM?', 'Can someone explain how the virtual DOM works in React and why it matters for performance?', '2025-07-01 10:00:00'),
    ('post-2', 'course-1', 'user-2', 'useState vs useReducer', 'When should I use useReducer instead of useState? Are there performance differences?', '2025-07-02 11:30:00'),
    ('post-3', 'course-1', 'user-4', 'Best practices for useEffect', 'I keep getting infinite loops with useEffect. What are the best practices for cleanup and dependency arrays?', '2025-07-03 09:15:00'),
    ('post-4', 'course-1', 'user-1', 'React Server Components', 'How do React Server Components differ from regular components? When should I use them?', '2025-07-04 14:00:00'),
    ('post-5', 'course-1', 'user-2', 'Custom hooks patterns', 'Share your favorite custom hook patterns! I will start: useLocalStorage for persisting state.', '2025-07-05 16:45:00'),
    ('post-6', 'course-2', 'user-2', 'Understanding event loop', 'Can someone break down how the Node.js event loop processes different types of callbacks?', '2025-07-01 08:00:00'),
    ('post-7', 'course-2', 'user-3', 'Stream vs Buffer', 'When should I use streams instead of reading entire files into buffers?', '2025-07-02 13:20:00'),
    ('post-8', 'course-2', 'user-3', 'Worker threads for CPU tasks', 'Has anyone used worker_threads for CPU-intensive tasks? How does it compare to child_process?', '2025-07-03 10:45:00'),
    ('post-9', 'course-2', 'user-2', 'Error handling patterns', 'What is your preferred error handling pattern in Express/Fastify? Global handler vs per-route?', '2025-07-04 15:30:00');
`);

// Some initial saves
sqlite.exec(`
  INSERT INTO saved_posts (id, user_id, post_id, active, created_at, updated_at) VALUES
    ('save-1', 'user-1', 'post-2', 1, '2025-07-02 12:00:00', '2025-07-02 12:00:00'),
    ('save-2', 'user-1', 'post-3', 1, '2025-07-03 10:00:00', '2025-07-03 10:00:00'),
    ('save-3', 'user-2', 'post-1', 1, '2025-07-01 11:00:00', '2025-07-01 11:00:00'),
    ('save-4', 'user-3', 'post-7', 1, '2025-07-02 14:00:00', '2025-07-02 14:00:00');
`);

console.log("Seed complete — data inserted.");
sqlite.close();
