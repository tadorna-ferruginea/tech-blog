CREATE TABLE IF NOT EXISTS activity_rsvps (
  activity_id TEXT NOT NULL,
  person_name TEXT NOT NULL,
  brings_ball INTEGER NOT NULL DEFAULT 0 CHECK (brings_ball IN (0, 1)),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (activity_id, person_name),
  FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS activity_rsvps_by_activity
  ON activity_rsvps (activity_id);
