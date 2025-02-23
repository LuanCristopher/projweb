// db.js
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "database.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Erro ao conectar ao banco de dados:", err.message);
  } else {
    console.log("Conectado ao banco de dados SQLite.");
  }
});

// Criação das tabelas
db.serialize(() => {
  // Tabela de usuários
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      password TEXT,
      token TEXT
    )
  `);

  // Tabela de produtos 
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      description TEXT,
      pricePix REAL,
      priceCard REAL,
      color TEXT,
      brand TEXT,
      gender TEXT,
      images TEXT
    )
  `);

  // Tabela de carrinho 
  db.run(`
    CREATE TABLE IF NOT EXISTS cart (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      productId INTEGER,
      quantity INTEGER DEFAULT 1,
      FOREIGN KEY(userId) REFERENCES users(id)
    )
  `);

  // Tabela de tickets (Fale Conosco)
  db.run(`
    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT,
      message TEXT,
      date DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Produtos
  db.get("SELECT COUNT(*) AS count FROM products", (err, row) => {
    if (err) {
      console.error(err);
    } else if (row.count == 0) {
      const insert = db.prepare(`
        INSERT INTO products (name, description, pricePix, priceCard, color, brand, gender, images)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      insert.run(
        "Bermuda Biker",
        "Bermuda Biker feminina, ideal para treinos e uso casual.",
        80.0,
        90.0,
        "Preto",
        "Genérica",
        "Feminino",
        JSON.stringify(["../fotos-geral/fotos-product/bermuda-biker.webp"])
      );
      insert.run(
        "Calça Legging",
        "Calça legging para atividades físicas, com tecido confortável.",
        120.0,
        135.0,
        "Rosa",
        "Nike",
        "Feminino",
        JSON.stringify(["../fotos-geral/fotos-product/calca-leggin.webp"])
      );
      insert.run(
        "Camiseta Adidas",
        "Camiseta leve e confortável para o dia a dia.",
        100.0,
        110.0,
        "Azul",
        "Adidas",
        "Unissex",
        JSON.stringify(["../fotos-geral/fotos-product/camiseta-adidas.webp"])
      );
      insert.run(
        "Regata Diadora",
        "Regata Diadora básica, perfeita para corridas e exercícios.",
        90.0,
        100.0,
        "Preto",
        "Diadora",
        "Feminino",
        JSON.stringify(["../fotos-geral/fotos-product/regata-diadora.webp"])
      );
      insert.run(
        "Regata Fila Transfer - Preta",
        "Blusa feminina em malha de viscose com elastano.",
        120.0,
        135.0,
        "Preto",
        "Fila",
        "Feminino",
        JSON.stringify([
          "../fotos-geral/fotos-product/regata-fila-transfer-1.webp",
          "../fotos-geral/fotos-product/regata-fila-transfer-2.webp",
          "../fotos-geral/fotos-product/regata-fila-transfer-3.webp"
        ])
      );
      insert.run(
        "Regata Malwee",
        "Regata Malwee para uso casual.",
        70.0,
        80.0,
        "Branca",
        "Malwee",
        "Feminino",
        JSON.stringify(["../fotos-geral/fotos-product/regata-malwee.webp"])
      );
      insert.finalize();
    }
  });
});

module.exports = db;
