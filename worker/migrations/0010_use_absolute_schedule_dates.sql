-- A rolling display window is not part of a schedule record's identity.
-- Keep the newest version of each person's absolute date-and-slot selection.
CREATE TABLE availability_v2 (
  person_name TEXT NOT NULL,
  date TEXT NOT NULL,
  start_minute INTEGER NOT NULL,
  brings_ball INTEGER NOT NULL DEFAULT 0 CHECK (brings_ball IN (0, 1)),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (person_name, date, start_minute)
);

INSERT INTO availability_v2 (person_name, date, start_minute, brings_ball, updated_at)
SELECT person_name, date, start_minute, brings_ball, updated_at
FROM (
  SELECT
    person_name,
    date,
    start_minute,
    brings_ball,
    updated_at,
    ROW_NUMBER() OVER (
      PARTITION BY person_name, date, start_minute
      ORDER BY updated_at DESC, rowid DESC
    ) AS row_number
  FROM availability
)
WHERE row_number = 1;

DROP TABLE availability;
ALTER TABLE availability_v2 RENAME TO availability;
CREATE INDEX availability_by_slot ON availability (date, start_minute);

DROP INDEX activities_by_week;
ALTER TABLE activities DROP COLUMN week_start;
CREATE INDEX activities_by_date ON activities (date, start_minute);

ALTER TABLE comments DROP COLUMN week_start;
