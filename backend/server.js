const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');
const parser = require('body-parser');
const { error } = require('console');
const { request } = require('http');

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
    const { title, description, anime_episodes, anime_id } = request.body;

    //check if exists
    const dupechecker = 'SELECT COUNT(*) AS count FROM listing WHERE title = ?';
    db.get(dupechecker, [title], (err, row) => {
        if (err) {
            console.error('error in checking existence: ', err.message);
            return response.status(500).json({ error: 'db error' });
        }
        if (row.count > 0) {
            return response.status(400).json({error: 'already in db'});
        }

        // If anime doesn't exist, insert it
        const insertQuery = 'INSERT INTO listing (title, description, anime_episodes, anime_id) VALUES (?, ?, ?, ?)';
        db.run(insertQuery, [title, description, anime_episodes, anime_id], function (err) {
            if (err) {
                console.error('Error adding anime:', err.message);
                return response.status(500).json({ error: 'Failed to add anime' });
            }

            response.status(200).json({ message: 'Anime added successfully', id: this.lastID });
        });
    });
});



app.get('/api/userlist', (request, response) => {
    db.all('SELECT * FROM listing', [], (err, rows) => {
    if(err) { 
        console.error(err.message)
        return response.status(500).json({error: "Failed retrieving user's listed data.", detail: err.message})
    }
    response.status(200).json(rows)
})

}); 

app.delete('/api/deleteanime', (request, response) => {

    const {id} = request.body;
    db.run('DELETE FROM listing WHERE id = ?', [id], (err) => {
        if(err) {
            console.error('db error: ', err.message)
            response.status(500).json({error: 'failed to delete'})
        } else {
            response.status(200).json({message: 'deleted successfully'})
        }
    })
})

app.put('/api/updateprog', (request, response) => {
    const { id, user_progress } = request.body;

    if (!id || user_progress == null) {
        return res.status(400).json({ error: 'Invalid request. Missing id or progress.' });
    }
 
    const query = `UPDATE listing SET user_progress = ? WHERE id = ?`;
    db.run(query, [user_progress, id], function (err) {
        if (err) {
            console.error('Error updating progress:', err.message);
            return response.status(500).json({ error: 'Database update failed.' });
        }

        if (this.changes === 0) {
            return response.status(404).json({ error: 'Anime not found.' });
        }

        response.status(200).json({ message: 'Progress updated successfully.' });
    });
});



app.get('/api/offline', (req, res) => {
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