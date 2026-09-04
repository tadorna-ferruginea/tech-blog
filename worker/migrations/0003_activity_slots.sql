-- One row per occupied half-hour makes overlapping activities impossible at the database level.
CREATE TABLE IF NOT EXISTS activity_slots (
  date TEXT NOT NULL,
  start_minute INTEGER NOT NULL CHECK (start_minute >= 720 AND start_minute < 1200 AND start_minute % 30 = 0),
  activity_id TEXT NOT NULL,
  PRIMARY KEY (date, start_minute),
  FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS activity_slots_by_activity
  ON activity_slots (activity_id);
