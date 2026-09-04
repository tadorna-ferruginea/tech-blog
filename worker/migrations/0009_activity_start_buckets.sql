-- Activities may overlap. Only their date-and-half-hour start buckets are unique.
DROP TABLE IF EXISTS activity_slots;

CREATE UNIQUE INDEX IF NOT EXISTS activities_by_start_bucket
  ON activities (date, CAST(start_minute / 30 AS INTEGER));
