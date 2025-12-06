const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: 'ok'});
});

app.get('/items', (req, res) => {
  res.json([{ id: 1, name: 'example-item' }]);
});

app.listen(port, () => {
    console.log(`Backend listening on port ${port}`);
});