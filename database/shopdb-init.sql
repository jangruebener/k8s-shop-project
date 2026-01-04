USE shopdb;

CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL CHECK (price >=0),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO products (name, price, description) VALUES
  ('T-Shirt black M', 19.99, 'basic T-Shirt in black, size M'),
  ('Hoodie grey L', 39.90, 'warm hoodie in grey, size L'),
  ('coffe mug Logo', 9.50, 'coffe mug with brand icon'),
  ('Sticker pack', 4.99, 'Set with 10 stickers'),
  ('Basecap blue', 24.90, 'Basecap in clue, standard size');

CREATE USER IF NOT EXISTS 'shop_app'@'%' IDENTIFIED BY 'CHANGE_ME_STRONG_PASSWORD';
GRANT SELECT, INSERT, UPDATE, DELETE ON shopdb.* TO 'shop_app'@'%';
FLUSH PRIVILEGES;