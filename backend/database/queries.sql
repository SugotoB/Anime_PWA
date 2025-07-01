-- Drop existing tables if they exist
DROP TABLE IF EXISTS listing;
DROP TABLE IF EXISTS offline;
DROP TABLE IF EXISTS users;

-- Create users table for authentication
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    is_active BOOLEAN DEFAULT 1
);

-- Create updated listing table with user_id foreign key
CREATE TABLE listing (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    anime_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    anime_episodes INTEGER,
    user_progress INTEGER NOT NULL DEFAULT 0,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create offline anime table
CREATE TABLE offline (
    mal_id INTEGER PRIMARY KEY AUTOINCREMENT,  
    title TEXT NOT NULL,              
    synopsis TEXT,                
    episodes INTEGER NOT NULL,   
    image_path TEXT NOT NULL
);

-- Insert sample offline anime data
INSERT INTO offline (title, synopsis, episodes, image_path)
VALUES 
('a', 
 'In a world where nearly everyone has superpowers, a boy chinese powers dreams of becoming a hero.', 
 138, 
 'images/animeicon.png'),

 ('b', 
 'In a world where nearly everyone has superpowers, a boy chinese powers dreams of becoming a hero.', 
 138, 
 'images/animeicon.png'),

 ('c', 
 'In a world where nearly everyone has superpowers, a boy chinese powers dreams of becoming a hero.', 
 138, 
 'images/animeicon.png'),

 ('d', 
 'In a world where nearly everyone has superpowers, a boy chinese powers dreams of becoming a hero.', 
 138, 
 'images/animeicon.png'),

 ('e', 
 'In a world where nearly everyone has superpowers, a boy chinese powers dreams of becoming a hero.', 
 138, 
 'images/animeicon.png'),

 ('f', 
 'In a world where nearly everyone has superpowers, a boy chinese powers dreams of becoming a hero.', 
 138, 
 'images/animeicon.png'),

 ('g', 
 'In a world where nearly everyone has superpowers, a boy chinese powers dreams of becoming a hero.', 
 138, 
 'images/animeicon.png'),

 ('h', 
 'In a world where nearly everyone has superpowers, a boy chinese powers dreams of becoming a hero.', 
 138, 
 'images/animeicon.png'),

 ('i', 
 'In a world where nearly everyone has superpowers, a boy chinese powers dreams of becoming a hero.', 
 138, 
 'images/animeicon.png'),

 ('j', 
 'In a world where nearly everyone has superpowers, a boy chinese powers dreams of becoming a hero.', 
 138, 
 'images/animeicon.png'),

 ('k', 
 'In a world where nearly everyone has superpowers, a boy chinese powers dreams of becoming a hero.', 
 138, 
 'images/animeicon.png'),

 ('l', 
 'In a world where nearly everyone has superpowers, a boy chinese powers dreams of becoming a hero.', 
 138, 
 'images/animeicon.png'),

 ('m', 
 'In a world where nearly everyone has superpowers, a boy chinese powers dreams of becoming a hero.', 
 138, 
 'images/animeicon.png');

-- Create indexes for better performance
CREATE INDEX idx_listing_user_id ON listing(user_id);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);

 