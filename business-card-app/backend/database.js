const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'cards.db');

let db;

function initDb() {
  db = new Database(DB_PATH);

  // Enable WAL mode for better performance
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Create the main cards table
  db.exec(`
    CREATE TABLE IF NOT EXISTS cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      company TEXT,
      job_title TEXT,
      email TEXT,
      phone TEXT,
      website TEXT,
      address TEXT,
      notes TEXT,
      tags TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT
    );
  `);

  // Create FTS5 virtual table for full-text search
  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS cards_fts USING fts5(
      name,
      company,
      job_title,
      email,
      content='cards',
      content_rowid='id'
    );
  `);

  // Trigger: after insert, add to FTS
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS cards_ai AFTER INSERT ON cards BEGIN
      INSERT INTO cards_fts(rowid, name, company, job_title, email)
        VALUES (new.id, new.name, COALESCE(new.company, ''), COALESCE(new.job_title, ''), COALESCE(new.email, ''));
    END;
  `);

  // Trigger: after delete, remove from FTS
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS cards_ad AFTER DELETE ON cards BEGIN
      INSERT INTO cards_fts(cards_fts, rowid, name, company, job_title, email)
        VALUES ('delete', old.id, old.name, COALESCE(old.company, ''), COALESCE(old.job_title, ''), COALESCE(old.email, ''));
    END;
  `);

  // Trigger: after update, update FTS (delete old, insert new)
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS cards_au AFTER UPDATE ON cards BEGIN
      INSERT INTO cards_fts(cards_fts, rowid, name, company, job_title, email)
        VALUES ('delete', old.id, old.name, COALESCE(old.company, ''), COALESCE(old.job_title, ''), COALESCE(old.email, ''));
      INSERT INTO cards_fts(rowid, name, company, job_title, email)
        VALUES (new.id, new.name, COALESCE(new.company, ''), COALESCE(new.job_title, ''), COALESCE(new.email, ''));
    END;
  `);

  console.log('Database initialized at', DB_PATH);
  return db;
}

function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return db;
}

module.exports = { getDb, initDb };
