import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { postsRoutes } from "./routes/posts.js";
import { savedRoutes } from "./routes/saved.js";
import { coursesRoutes } from "./routes/courses.js";

const app = new Elysia()
  .use(cors({ origin: "http://localhost:3000" }))
  .use(coursesRoutes)
  .use(postsRoutes)
  .use(savedRoutes)
  .get("/health", () => ({ status: "ok" }))
  .onError(({ error, set }) => {
    // Handle thrown Response objects from auth middleware
    if (error instanceof Response) {
      set.status = error.status as number;
      return error.json();
    }
    console.error(error);
    set.status = 500;
    return { error: "Internal server error" };
  })
  .listen(4000);

console.log(`Server running at http://localhost:${app.server?.port}`);
