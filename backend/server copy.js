const express = require('express');
const app = express();
const port = 3000;
const mysql = require('mysql2/promise');

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'DB Password',
    database: process.env.DB_NAME || 'shopdb',
};

app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: 'ok'});
});

app.get('/items', async (req, res) => {
    try {
        const conn = await mysql.createConnection(dbConfig);
        const [rows] = await conn.query('SELECT 1 AS test');
        await conn.end();
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'DB error' });
    }
});

app.listen(port, () => {
    console.log(`Backend listening on port ${port}`);
});