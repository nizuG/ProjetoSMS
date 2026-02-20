const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

// Forçar caminho absoluto correto
const dbPath = path.join(__dirname, "database.db");

console.log("Caminho real do banco:", dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Erro ao conectar no banco:", err.message);
  } else {
    console.log("Banco SQLite conectado com sucesso.");
  }
});

db.serialize(() => {
  // GARANTIR ESTRUTURA ATUAL
//  db.run(`DROP TABLE IF EXISTS arquivos`);
//  db.run(`DROP TABLE IF EXISTS dados_importados`);
//  db.run(`DROP TABLE IF EXISTS dicionario`);


  db.run(`
       CREATE TABLE IF NOT EXISTS arquivos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome_arquivo TEXT NOT NULL,
        tipo TEXT NOT NULL,
        competencia TEXT NOT NULL,
        indicador TEXT NOT NULL,
        data_upload DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (competencia, indicador)
    )
    `);

  db.run(`
        CREATE TABLE IF NOT EXISTS dados_importados (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            arquivo_id INTEGER,
            conteudo TEXT,
            FOREIGN KEY (arquivo_id) REFERENCES arquivos(id)
        )
    `);

  db.run(`
        CREATE TABLE IF NOT EXISTS dicionario (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            arquivo_id INTEGER,
            coluna TEXT,
            descricao TEXT,
            FOREIGN KEY (arquivo_id) REFERENCES arquivos(id)
        )
    `);

  console.log("Estrutura recriada com sucesso.");
});

module.exports = db;
