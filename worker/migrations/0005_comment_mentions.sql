ALTER TABLE comments ADD COLUMN reply_to_id TEXT REFERENCES comments(id);

CREATE INDEX IF NOT EXISTS comments_by_reply_target
  ON comments (reply_to_id);
