import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "./schema.js";
import { resolve } from "path";
import { mkdirSync } from "fs";

const dbPath = resolve(import.meta.dirname, "../../data/forum.db");
mkdirSync(resolve(import.meta.dirname, "../../data"), { recursive: true });

const sqlite = new Database(dbPath);
sqlite.exec("PRAGMA journal_mode = WAL;");
sqlite.exec("PRAGMA foreign_keys = ON;");

export const db = drizzle(sqlite, { schema });
export type DB = typeof db;
