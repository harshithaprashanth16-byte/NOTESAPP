import { Database } from "bun:sqlite";
import { existsSync, mkdirSync, unlinkSync } from "node:fs";
import { join } from "node:path";

// Ensure data directory exists
const dataDir = join(process.cwd(), "data");
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

// Ensure uploads directory exists
export const uploadsDir = join(process.cwd(), "uploads");
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
}

const db = new Database(join(dataDir, "notes.db"), { create: true });

// Enable foreign keys
db.run("PRAGMA foreign_keys = ON;");

// Initialize tables
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS subjects (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS resources (
    id TEXT PRIMARY KEY,
    subject_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    storage_path TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY(subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_subjects_user ON subjects(user_id);
  CREATE INDEX IF NOT EXISTS idx_resources_user ON resources(user_id);
  CREATE INDEX IF NOT EXISTS idx_resources_subject ON resources(subject_id);
`);

export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  salt: string;
  created_at: string;
}

export interface Subject {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  resource_count?: number;
}

export interface Resource {
  id: string;
  subject_id: string;
  user_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  created_at: string;
  subject_name?: string;
}

export const dbQueries = {
  // Users
  createUser: db.prepare(`
    INSERT INTO users (id, name, email, password_hash, salt, created_at)
    VALUES ($id, $name, $email, $password_hash, $salt, $created_at)
  `),

  findUserByEmail: db.prepare(`
    SELECT * FROM users WHERE email = $email COLLATE NOCASE
  `),

  findUserById: db.prepare(`
    SELECT id, name, email, created_at FROM users WHERE id = $id
  `),

  updateUserName: db.prepare(`
    UPDATE users SET name = $name WHERE id = $id
  `),

  // Subjects
  createSubject: db.prepare(`
    INSERT INTO subjects (id, user_id, name, description, created_at)
    VALUES ($id, $user_id, $name, $description, $created_at)
  `),

  getSubjectsByUser: db.prepare(`
    SELECT s.*, COUNT(r.id) as resource_count
    FROM subjects s
    LEFT JOIN resources r ON s.id = r.subject_id
    WHERE s.user_id = $user_id
    GROUP BY s.id
    ORDER BY s.created_at DESC
  `),

  getSubjectByIdAndUser: db.prepare(`
    SELECT * FROM subjects WHERE id = $id AND user_id = $user_id
  `),

  deleteSubject: db.prepare(`
    DELETE FROM subjects WHERE id = $id AND user_id = $user_id
  `),

  // Resources
  getResourcesBySubject: db.prepare(`
    SELECT * FROM resources
    WHERE subject_id = $subject_id AND user_id = $user_id
    ORDER BY created_at DESC
  `),

  getRecentResourcesByUser: db.prepare(`
    SELECT r.*, s.name as subject_name
    FROM resources r
    JOIN subjects s ON r.subject_id = s.id
    WHERE r.user_id = $user_id
    ORDER BY r.created_at DESC
    LIMIT $limit
  `),

  getResourceByIdAndUser: db.prepare(`
    SELECT * FROM resources WHERE id = $id AND user_id = $user_id
  `),

  getResourcesBySubjectId: db.prepare(`
    SELECT * FROM resources WHERE subject_id = $subject_id AND user_id = $user_id
  `),

  createResource: db.prepare(`
    INSERT INTO resources (id, subject_id, user_id, file_name, file_type, file_size, storage_path, created_at)
    VALUES ($id, $subject_id, $user_id, $file_name, $file_type, $file_size, $storage_path, $created_at)
  `),

  deleteResource: db.prepare(`
    DELETE FROM resources WHERE id = $id AND user_id = $user_id
  `),

  // Search
  searchSubjects: db.prepare(`
    SELECT s.*, COUNT(r.id) as resource_count
    FROM subjects s
    LEFT JOIN resources r ON s.id = r.subject_id
    WHERE s.user_id = $user_id AND (s.name LIKE $query OR s.description LIKE $query)
    GROUP BY s.id
    ORDER BY s.created_at DESC
  `),

  searchResources: db.prepare(`
    SELECT r.*, s.name as subject_name
    FROM resources r
    JOIN subjects s ON r.subject_id = s.id
    WHERE r.user_id = $user_id AND r.file_name LIKE $query
    ORDER BY r.created_at DESC
  `),

  // Stats
  getUserStats: db.prepare(`
    SELECT 
      (SELECT COUNT(*) FROM subjects WHERE user_id = $user_id) as total_subjects,
      (SELECT COUNT(*) FROM resources WHERE user_id = $user_id) as total_resources
  `)
};

export function deleteFileSafely(storagePath: string) {
  try {
    if (existsSync(storagePath)) {
      unlinkSync(storagePath);
    }
  } catch (err) {
    console.error("Failed to delete file from disk:", storagePath, err);
  }
}

export default db;
