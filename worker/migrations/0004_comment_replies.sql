ALTER TABLE comments ADD COLUMN parent_id TEXT REFERENCES comments(id);

CREATE INDEX IF NOT EXISTS comments_by_parent
  ON comments (parent_id, created_at);
