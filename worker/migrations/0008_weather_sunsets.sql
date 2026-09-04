CREATE TABLE IF NOT EXISTS weather_day (
  date TEXT PRIMARY KEY,
  sunset TEXT NOT NULL,
  fetched_at TEXT NOT NULL
);
