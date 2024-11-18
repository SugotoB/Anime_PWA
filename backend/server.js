const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');
const parser = require('body-parser');

const app = express();

app.use(cors());

app.use(express.json());
app.use(parser.urlencoded({extended: true}));

app.use(express.static(path.join(__dirname, '..', 'public')));

const db = new sqlite3.Database(path.join(__dirname, 'database', 'ListUser.db'), (err) => {
    if (err) {
        console.error('Db failed opening', err);
    } else {
        console.log('connected to db');
    }
});



 
app.post('/api/addinganime', (request, response) => {
    const { title, description, anime_episodes } = request.body;

    const query = 'INSERT INTO listing (title, description, anime_episodes) VALUES (?, ?, ?)';
    db.run(query, [title, description, anime_episodes], function (err) {
        if (err) {
            console.error(err.message);
            return response.status(500).json({ error: 'Anime add failed' });
        }
        response.status(200).json({ message: 'Anime added successfully', id: this.lastID });
    });
});


const port = 3000;
app.listen(port, () => {
    console.log(`running http://localhost:${port}`);
});