-- CREATE TABLE listing (
--     id INTEGER PRIMARY KEY AUTOINCREMENT,
--     anime_id INTEGER NOT NULL,
--     title TEXT NOT NULL,
--     description TEXT,
--     anime_episodes INTEGER,
--     user_progress INTEGER NOT NULL DEFAULT 0,
--     UNIQUE(anime_id) 
-- );



-- drop table listing;




-- drop TABLE listing;
-- select * from Userlisting;
-- DELETE FROM listing;

-- CREATE TABLE offline (
--     anime_id INTEGER PRIMARY KEY AUTOINCREMENT,  
--     title TEXT NOT NULL,              
--     description TEXT,                
--     anime_episodes INTEGER NOT NULL,   
--     image_path TEXT NOT NULL);

-- drop table offline;

UPDATE offline
SET image_path = NULL;