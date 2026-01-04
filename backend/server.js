import express from 'express';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const DB_HOST = process.env.DB_HOST || 'mysql';
const DB_PORT = process.env.DB_PORT || 3306;
const DB_USER = process.env.DB_USER || 'shop_user';
const DB_PASSWORD = process.env.DB_PASSWORD || 'shop_password';
const DB_NAME = process.env.DB_NAME || 'shop_db';

const pool = mysql.createPool({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Healthcheck failed:', err.message);
    res.status(500).json({
      status: 'error',
      message: 'Database not reachable',
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/items', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, price, description, created_at FROM products'
    );
    res.status(200).json(rows);
  } catch (err) {
    console.error('Error fetching items:', err.message);
    res.status(500).json({
      error: 'Failed to fetch items'
    });
  }
});

app.post('/api/items', async (req, res) => {
  const { name, price, description } = req.body;

  if (!name || typeof price !== 'number') {
    return res.status(400).json({
      error: 'Invalid payload. "name" (string) and "price" (number) are required.'
    });
  }

  try {
    const [result] = await pool.execute(
      'INSERT INTO products (name, price, description) VALUES (?, ?, ?)',
      [name, price, description || null]
    );

    res.status(201).json({
      id: result.insertId,
      name,
      price,
      description: description || null
    });
  } catch (err) {
    console.error('Error inserting item:', err.message);
    res.status(500).json({
      error: 'Failed to insert item'
    });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`Shop backend listening on port ${PORT}`);
});