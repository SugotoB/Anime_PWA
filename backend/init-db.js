const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Read the SQL file
const sqlPath = path.join(__dirname, 'database', 'queries.sql');
const sqlContent = fs.readFileSync(sqlPath, 'utf8');

// Create database connection
const dbPath = path.join(__dirname, 'database', 'ListUser.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        process.exit(1);
    }
    console.log('Connected to the database.');
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON', (err) => {
    if (err) {
        console.error('Error enabling foreign keys:', err.message);
    } else {
        console.log('Foreign keys enabled.');
    }
});

// Execute SQL statements
const statements = sqlContent.split(';').filter(stmt => stmt.trim());

db.serialize(() => {
    statements.forEach((statement, index) => {
        const trimmedStatement = statement.trim();
        if (trimmedStatement) {
            db.run(trimmedStatement, (err) => {
                if (err) {
                    console.error(`Error executing statement ${index + 1}:`, err.message);
                    console.error('Statement:', trimmedStatement);
                } else {
                    console.log(`Statement ${index + 1} executed successfully.`);
                }
            });
        }
    });
});

// Close database connection
db.close((err) => {
    if (err) {
        console.error('Error closing database:', err.message);
    } else {
        console.log('Database initialized successfully!');
    }
}); 