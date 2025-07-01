require('dotenv').config({ path: '../.env' });
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');
const parser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const { error } = require('console');

const app = express();

// Security middleware
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));

// Rate limiting
const authLimiter = rateLimit({
    windowMs:  30 * 1000, // 30 seconds
    max: 5, // limit each IP to 5 requests per windowMs for auth routes
    message: 'Too many authentication attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,  
    legacyHeaders: false,
});

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // set to true in production with HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

app.use(express.json());
app.use(parser.urlencoded({extended: true}));

// Static files
app.use(express.static(path.join(__dirname, '..', 'public', 'pages')));
app.use(express.static(path.join(__dirname, '..', 'public', 'clientscripts')));
app.use(express.static(path.join(__dirname, '..', 'public', 'images')));
app.use(express.static(path.join(__dirname, '..', 'public')));

// Database connection
const db = new sqlite3.Database(path.join(__dirname, 'database', 'ListUser.db'), (err) => {
    if (err) {
        console.error('Db failed opening', err);
    } else {
        console.log('connected to db');
        // Enable foreign keys
        db.run('PRAGMA foreign_keys = ON');
    }
});

// Middleware to check if user is authenticated
function requireAuth(req, res, next) {
    if (req.session.userId) {
        next();
    } else {
        res.status(401).json({ error: 'Authentication required' });
    }
}

// Middleware to check if user is not authenticated (for login/signup pages)
function requireGuest(req, res, next) {
    if (!req.session.userId) {
        next();
    } else {
        res.redirect('/');
    }
}

// Routes

//used for redirecting user to login/signup page
app.get('/', (req, res) => {
    if (req.session.userId) {
        res.sendFile(path.join(__dirname, '..', 'public', 'pages', 'index.html'));
    } else {
        res.redirect('/login.html');
    }
});

app.get('/login.html', requireGuest, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'pages', 'login.html'));
});

app.get('/signup.html', requireGuest, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'pages', 'signup.html'));
});

// Authentication routes
app.post('/api/auth/signup', authLimiter, async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Input validation
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (username.length < 3 || username.length > 20) {
            return res.status(400).json({ error: 'Username must be 3-20 characters long' });
        }

        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            return res.status(400).json({ error: 'Username can only contain letters, numbers, and underscores' });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters long' });
        }

        // Check if username or email already exists
        db.get('SELECT id FROM users WHERE username = ? OR email = ?', [username, email], async (err, row) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            if (row) {
                return res.status(400).json({ error: 'Username or email already exists' });
            }

            // Hash password
            const saltRounds = 12;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            // Insert new user
            db.run('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)', 
                [username, email, hashedPassword], function(err) {
                if (err) {
                    console.error('Error creating user:', err);
                    return res.status(500).json({ error: 'Failed to create account' });
                }

                // Set session
                req.session.userId = this.lastID;
                req.session.username = username;

                res.status(201).json({ 
                    message: 'Account created successfully',
                    user: { id: this.lastID, username: username }
                });
            });
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
    try {
        const { username, password } = req.body;

        // Input validation
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        // Find user
        db.get('SELECT id, username, password_hash FROM users WHERE username = ? AND is_active = 1', 
            [username], async (err, user) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            if (!user) {
                return res.status(401).json({ error: 'Invalid username or password' });
            }

            // Check password
            const isValidPassword = await bcrypt.compare(password, user.password_hash);
            if (!isValidPassword) {
                return res.status(401).json({ error: 'Invalid username or password' });
            }

            // Update last login
            db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

            // Set session
            req.session.userId = user.id;
            req.session.username = user.username;

            res.json({ 
                message: 'Login successful',
                user: { id: user.id, username: user.username }
            });
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to logout' });
        }
        res.json({ message: 'Logged out successfully' });
    });
});

app.delete('/api/auth/delete-account', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;

        // Delete user's anime list first (cascade will handle this, but explicit for clarity)
        db.run('DELETE FROM listing WHERE user_id = ?', [userId], (err) => {
            if (err) {
                console.error('Error deleting user anime list:', err);
                return res.status(500).json({ error: 'Failed to delete account' });
            }

            // Delete user account
            db.run('DELETE FROM users WHERE id = ?', [userId], (err) => {
                if (err) {
                    console.error('Error deleting user:', err);
                    return res.status(500).json({ error: 'Failed to delete account' });
                }

                // Destroy session
                req.session.destroy((err) => {
                    if (err) {
                        console.error('Error destroying session:', err);
                    }
                    res.json({ message: 'Account deleted successfully' });
                });
            });
        });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/auth/check', (req, res) => {
    if (req.session.userId) {
        res.json({ 
            authenticated: true, 
            user: { 
                id: req.session.userId, 
                username: req.session.username 
            } 
        });
    } else {
        res.json({ authenticated: false });
    }
});

// Protected API routes
app.post('/api/addinganime', requireAuth, generalLimiter, (req, res) => {
    const { title, description, anime_episodes, anime_id } = req.body;
    const userId = req.session.userId;

    // Check if anime already exists for this user
    const dupechecker = 'SELECT COUNT(*) AS count FROM listing WHERE title = ? AND user_id = ?';
    db.get(dupechecker, [title, userId], (err, row) => {
        if (err) {
            console.error('error in checking existence: ', err.message);
            return res.status(500).json({ error: 'db error' });
        }
        if (row.count > 0) {
            return res.status(400).json({error: 'Anime already in your list'});
        }

        // If anime doesn't exist, insert it
        const insertQuery = 'INSERT INTO listing (user_id, title, description, anime_episodes, anime_id) VALUES (?, ?, ?, ?, ?)';
        db.run(insertQuery, [userId, title, description, anime_episodes, anime_id], function (err) {
            if (err) {
                console.error('Error adding anime:', err.message);
                return res.status(500).json({ error: 'Failed to add anime' });
            }

            res.status(200).json({ message: 'Anime added successfully', id: this.lastID });
        });
    });
});

app.get('/api/userlist', requireAuth, generalLimiter, (req, res) => {
    const userId = req.session.userId;
    
    db.all('SELECT * FROM listing WHERE user_id = ? ORDER BY added_at DESC', [userId], (err, rows) => {
        if(err) { 
            console.error(err.message);
            return res.status(500).json({error: "Failed retrieving user's listed data.", detail: err.message});
        }
        res.status(200).json(rows);
    });
});

app.delete('/api/deleteanime', requireAuth, generalLimiter, (req, res) => {
    const {id} = req.body;
    const userId = req.session.userId;

    // Ensure user can only delete their own anime
    db.run('DELETE FROM listing WHERE id = ? AND user_id = ?', [id, userId], (err) => {
        if(err) {
            console.error('db error: ', err.message);
            return res.status(500).json({error: 'failed to delete'});
        }
        res.status(200).json({message: 'deleted successfully'});
    });
});

app.put('/api/updateprog', requireAuth, generalLimiter, (req, res) => {
    const { id, user_progress } = req.body;
    const userId = req.session.userId;

    if (!id || user_progress == null) {
        return res.status(400).json({ error: 'Invalid request. Missing id or progress.' });
    }

    // Ensure user can only update their own anime
    const query = `UPDATE listing SET user_progress = ? WHERE id = ? AND user_id = ?`;
    db.run(query, [user_progress, id, userId], function (err) {
        if (err) {
            console.error('Error updating progress:', err.message);
            return res.status(500).json({ error: 'Database update failed.' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: 'Anime not found or not authorized.' });
        }

        res.status(200).json({ message: 'Progress updated successfully.' });
    });
});

app.get('/api/offline', generalLimiter, (req, res) => {
    const { q } = req.query;  
    let sql = 'SELECT * FROM offline';
    const params = [];

    if (q) {
        sql += ` WHERE title LIKE ?`;
        params.push(`%${q}%`);
    }

    db.all(sql, params, (err, rows) => {
        if (err) {
            console.error('Error fetching data:', err);
            return res.status(500).json({ error: 'Database query failed' });
        }
        res.json(rows); 
    });
});

const port = 3000;
app.listen(port, () => {
    console.log(`running http://localhost:${port}`);
}); 