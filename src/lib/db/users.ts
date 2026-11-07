/**
 * SpeakLife AI — User Repository
 * Database operations for user accounts.
 */

import { getDatabase } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { v4 as uuidv4 } from "uuid";

export interface User {
  id: string;
  email: string;
  display_name: string;
  role: string;
  settings_json: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUserInput {
  email: string;
  displayName: string;
  password: string;
}

export function createUser(input: CreateUserInput): User {
  const db = getDatabase();
  const id = `user_${uuidv4().replace(/-/g, "").slice(0, 16)}`;
  const { hash, salt } = hashPassword(input.password);

  const stmt = db.prepare(`
    INSERT INTO users (id, email, display_name, password_hash, password_salt, role, settings_json)
    VALUES (?, ?, ?, ?, ?, 'student', '{}')
  `);

  stmt.run(id, input.email.toLowerCase().trim(), input.displayName.trim(), hash, salt);

  return getUserById(id)!;
}

export function getUserById(id: string): User | null {
  const db = getDatabase();
  const row = db.prepare(
    "SELECT id, email, display_name, role, settings_json, created_at, updated_at FROM users WHERE id = ?"
  ).get(id) as User | undefined;
  return row || null;
}

export function getUserByEmail(email: string): User | null {
  const db = getDatabase();
  const row = db.prepare(
    "SELECT id, email, display_name, role, settings_json, created_at, updated_at FROM users WHERE email = ?"
  ).get(email.toLowerCase().trim()) as User | undefined;
  return row || null;
}

export function authenticateUser(email: string, password: string): User | null {
  const db = getDatabase();
  const row = db.prepare(
    "SELECT id, email, display_name, role, settings_json, password_hash, password_salt, created_at, updated_at FROM users WHERE email = ?"
  ).get(email.toLowerCase().trim()) as (User & { password_hash: string; password_salt: string }) | undefined;

  if (!row) return null;

  const isValid = verifyPassword(password, row.password_hash, row.password_salt);
  if (!isValid) return null;

  // Return user without password fields
  const { password_hash, password_salt, ...user } = row;
  return user;
}

export function updateUserSettings(userId: string, settingsJson: string): boolean {
  const db = getDatabase();
  const result = db.prepare(
    "UPDATE users SET settings_json = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(settingsJson, userId);
  return result.changes > 0;
}

export function getUserCount(): number {
  const db = getDatabase();
  const row = db.prepare("SELECT count(*) as count FROM users").get() as { count: number };
  return row.count;
}
