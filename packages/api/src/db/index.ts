import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "./schema";

const DATABASE_URL = process.env.DATABASE_URL || "file:./data/swag.db";

// Strip "file:" prefix for bun:sqlite
const dbPath = DATABASE_URL.replace(/^file:/, "");

const sqlite = new Database(dbPath, { create: true });
sqlite.exec("PRAGMA journal_mode = WAL;");

export const db = drizzle(sqlite, { schema });
export type DbInstance = typeof db;
