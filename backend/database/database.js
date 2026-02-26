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
  //  db.run(`DROP TABLE IF EXISTS notaquadrimestre`);
  //  db.run(`DROP TABLE IF EXISTS notas_vinculo`);
  //  db.run(`DROP TABLE IF EXISTS notas_vinculo_mes`);
  // db.run(`DROP TABLE IF EXISTS notasmes`);

  db.run(`
    CREATE TABLE IF NOT EXISTS notas_vinculo (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        quadrimestre TEXT NOT NULL,
        cnes TEXT NOT NULL,
        estabelecimento TEXT,
        ine TEXT,
        nome_equipe TEXT,
        dimensao_cadastro REAL NOT NULL,
        dimensao_acompanhamento REAL NOT NULL,
        nota_final REAL NOT NULL,
        classificacao_final TEXT NOT NULL
    )
`);


    db.run(`
    CREATE TABLE IF NOT EXISTS notasmes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        competencia TEXT NOT NULL,
        indicador TEXT NOT NULL,
        cnes TEXT NOT NULL,
        estabelecimento TEXT,
        ine TEXT,
        nome_equipe TEXT,
        nota_final REAL NOT NULL
    )
`);




    db.run(`
    CREATE TABLE IF NOT EXISTS notas_vinculo_mes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        competencia TEXT NOT NULL,
        cnes TEXT NOT NULL,
        estabelecimento TEXT,
        ine TEXT,
        nome_equipe TEXT,
        parametro_populacional REAL NOT NULL,
        pessoas_cadastradas REAL NOT NULL,
        total_acompanhados REAL NOT NULL,
        total_vinculados REAL NOT NULL,
        nota_final REAL NOT NULL
    )
`);

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

  db.run(`
        CREATE TABLE IF NOT EXISTS notaquadrimestre (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            quadrimestre TEXT,
            cnes TEXT,
            estabelecimento TEXT,
            ine TEXT,
            nome_equipe TEXT,
            nota_final REAL,
            classificacao_final TEXT
        )
`);

  console.log("Estrutura recriada com sucesso.");
});

module.exports = db;
