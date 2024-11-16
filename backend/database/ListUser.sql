CREATE TABLE listing (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    anime_episodes INTEGER NOT NULL,
    user_progress INTEGER NOT NULL DEFAULT 0,
    UNIQUE(title, description)
);

-- drop TABLE listing;
-- select * from Userlisting;
-- DELETE FROM listing;
