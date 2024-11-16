CREATE TABLE Userlisting (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    anime_episodes INTEGER NOT NULL,
    user_progress INTEGER NOT NULL DEFAULT 0
);

select * from Userlisting;
