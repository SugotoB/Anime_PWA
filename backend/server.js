const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');
const parser = require('body-parser');

const app = express();

app.use(cors());
app.use(express.json());
app.use(parser.urlencoded({extended: true}));

app.use(express.static(path.join(__dirname, 'AnimePWA', 'public')));

const db = new sqlite3.Database('backend/database/userlist.db', (err) => {
    if (err) {
        console.error('Db failed opening', err);
    } else {
        console.log('connected to db');
    }
});


const port = 500;
app.listen(port, () => {
    console.log(`running http://localhost:${port}`);
});
