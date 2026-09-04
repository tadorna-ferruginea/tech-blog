CREATE TABLE IF NOT EXISTS availability (
  week_start TEXT NOT NULL,
  person_name TEXT NOT NULL,
  date TEXT NOT NULL,
  start_minute INTEGER NOT NULL,
  brings_ball INTEGER NOT NULL DEFAULT 0 CHECK (brings_ball IN (0, 1)),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (week_start, person_name, date, start_minute)
);

CREATE INDEX IF NOT EXISTS availability_by_slot
  ON availability (week_start, date, start_minute);

CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  week_start TEXT NOT NULL,
  date TEXT NOT NULL,
  start_minute INTEGER NOT NULL,
  end_minute INTEGER NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (start_minute >= 720 AND end_minute <= 1200 AND end_minute > start_minute)
);

CREATE INDEX IF NOT EXISTS activities_by_week
  ON activities (week_start, date, start_minute);

CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  week_start TEXT NOT NULL,
  author TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS comments_by_expiry
  ON comments (expires_at);

CREATE TABLE IF NOT EXISTS weather_hour (
  date TEXT NOT NULL,
  hour INTEGER NOT NULL,
  temperature_c INTEGER NOT NULL,
  weather_code INTEGER NOT NULL,
  fetched_at TEXT NOT NULL,
  PRIMARY KEY (date, hour)
);
