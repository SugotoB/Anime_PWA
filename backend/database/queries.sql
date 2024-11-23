CREATE TABLE listing (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    anime_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    anime_episodes INTEGER NOT NULL,
    user_progress INTEGER NOT NULL DEFAULT 0,
    UNIQUE(anime_id) 
);



-- drop table listing;

-- UPDATE Table listing


-- drop TABLE listing;
-- select * from Userlisting;
-- DELETE FROM listing;

-- CREATE TABLE offlineanime (
--     id INTEGER PRIMARY KEY AUTOINCREMENT,
--     title TEXT NOT NULL,
--     description TEXT,
--     anime_episodes INTEGER NOT NULL,
-- );
