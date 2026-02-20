const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { parse } = require("csv-parse");
const db = require("./database/database");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));
app.use(bodyParser.json());
app.use(bodyParser.json({ limit: "50000000mb" })); // ou um valor maior se precisar
app.use(bodyParser.urlencoded({ limit: "50000000mb", extended: true }));

/* ================= MULTER ================= */

const upload = multer({
  storage: multer.memoryStorage(),
});

/* ================= ROTA TESTE ================= */

app.get("/", (req, res) => {
  res.json({ mensagem: "Servidor rodando corretamente 🚀" });
});

/* ================= LIMPAR BANCO ================= */

app.delete("/limpar-banco", (req, res) => {
  db.serialize(() => {
    db.run(`DELETE FROM dados_importados`);
    db.run(`DELETE FROM dicionario`);
    db.run(`DELETE FROM arquivos`);

    db.run(`DELETE FROM sqlite_sequence WHERE name='dados_importados'`);
    db.run(`DELETE FROM sqlite_sequence WHERE name='dicionario'`);
    db.run(`DELETE FROM sqlite_sequence WHERE name='arquivos'`);
  });

  res.json({ mensagem: "Banco limpo com sucesso." });
});

/* ================= UPLOAD CSV ================= */

app.post("/upload", upload.single("arquivo"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ erro: "Nenhum arquivo enviado." });
  }

  const { originalname, mimetype, buffer } = req.file;

  let fileContent = buffer.toString("utf-8");
  fileContent = fileContent.replace(/^\uFEFF/, "");

  const linhas = fileContent.split("\n");

  const competenciaMatch = fileContent.match(/Competência selecionada:\s*(.*)/);
  const indicadorMatch = fileContent.match(/Indicador selecionado:\s*(.*)/);

  const competencia = competenciaMatch ? competenciaMatch[1].trim() : null;
  const indicador = indicadorMatch ? indicadorMatch[1].trim() : null;

  if (!competencia || !indicador) {
    return res.status(400).json({
      erro: "Competência ou indicador não encontrados no arquivo.",
    });
  }

  // 🔎 VERIFICAR DUPLICADO ANTES
  db.get(
    `SELECT id FROM arquivos WHERE competencia = ? AND indicador = ?`,
    [competencia, indicador],
    (err, row) => {
      if (err) {
        return res.status(500).json({ erro: err.message });
      }

      if (row) {
        return res.status(409).json({
          erro: "Arquivo já inserido anteriormente para essa competência e indicador.",
        });
      }

      // 🔽 AGORA SIM INSERE
      db.run(
        `INSERT INTO arquivos (nome_arquivo, tipo, competencia, indicador)
                 VALUES (?, ?, ?, ?)`,
        [originalname, mimetype, competencia, indicador],
        function (err) {
          if (err) {
            return res.status(500).json({ erro: err.message });
          }

          const arquivoId = this.lastID;

          /* ================= PROCESSAR DADOS ================= */

          const inicioCabecalho = linhas.findIndex((l) =>
            l.replace(/"/g, "").trim().startsWith("CPF;"),
          );

          const fimDados = linhas.findIndex((l) => l.includes("Fonte:"));

          const blocoDados = linhas
            .slice(inicioCabecalho, fimDados === -1 ? undefined : fimDados)
            .join("\n");

          parse(
            blocoDados,
            {
              columns: true,
              delimiter: ";",
              relax_quotes: true,
              relax_column_count: true,
              skip_empty_lines: true,
              trim: true,
            },
            (err, registros) => {
              if (err) {
                return res.status(500).json({ erro: err.message });
              }

              const stmt = db.prepare(
                `INSERT INTO dados_importados (arquivo_id, conteudo)
                             VALUES (?, ?)`,
              );

              registros.forEach((linha) => {
                stmt.run(arquivoId, JSON.stringify(linha));
              });

              stmt.finalize();

              res.json({
                mensagem: "Arquivo processado com sucesso.",
                competencia,
                indicador,
                total_linhas: registros.length,
              });
            },
          );

          /* ================= PROCESSAR DICIONÁRIO ================= */

          const inicioDicionario = linhas.findIndex((l) =>
            l.replace(/"/g, "").trim().startsWith("Coluna;Descrição"),
          );

          if (inicioDicionario !== -1) {
            for (let i = inicioDicionario + 1; i < linhas.length; i++) {
              let linha = linhas[i].replace(/"/g, "").trim();

              if (!linha || linha.startsWith("Raça Cor")) break;

              const partes = linha.split(";");

              if (partes.length >= 2) {
                const coluna = partes[0].trim();
                const descricao = partes.slice(1).join(";").trim();

                db.run(
                  `INSERT INTO dicionario (arquivo_id, coluna, descricao)
                 VALUES (?, ?, ?)`,
                  [arquivoId, coluna, descricao],
                );
              }
            }
          }
        },
      );
    },
  );
});

/* ================= LISTAR ARQUIVOS ================= */

app.get("/api/arquivos", (req, res) => {
  db.all(
    `SELECT id, nome_arquivo, competencia, indicador, data_upload
         FROM arquivos
         ORDER BY competencia DESC, indicador ASC`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ erro: err.message });
      }

      res.json(rows);
    },
  );
});

/* ================= COMPETÊNCIAS E INDICADORES ================= */

app.get('/api/lista-nominal/opcoes', (req, res) => {

    db.all(
        `SELECT competencia, indicador
         FROM arquivos
         ORDER BY competencia ASC, indicador ASC`,
        [],
        (err, rows) => {

            if (err) {
                return res.status(500).json({ erro: err.message });
            }

            res.json(rows);
        }
    );
});

/* ================= DADOS PARA dicionario ================= */

app.get('/api/lista-nominal/dicionario', (req, res) => {

    const { competencia, indicador } = req.query;

    if (!competencia || !indicador) {
        return res.status(400).json({ erro: "Competência e indicador são obrigatórios." });
    }

    db.get(
        `SELECT id FROM arquivos
         WHERE competencia = ? AND indicador = ?`,
        [competencia, indicador],
        (err, arquivo) => {

            if (err) {
                return res.status(500).json({ erro: err.message });
            }

            if (!arquivo) {
                return res.status(404).json({ erro: "Arquivo não encontrado." });
            }

            db.all(
                `SELECT * FROM dicionario
                 WHERE arquivo_id = ?`,
                [arquivo.id],
                (err, rows) => {

                    if (err) {
                        return res.status(500).json({ erro: err.message });
                    }

                    res.json(rows);
                }
            );
        }
    );
});

// ================= ROTA ANÁLISE =================
app.get("/api/lista-nominal/analise", (req, res) => {
  const { competencia, indicador } = req.query;
  if (!competencia || !indicador)
    return res.status(400).json({ erro: "Competência e indicador são obrigatórios." });

  db.get(
    `SELECT id FROM arquivos WHERE competencia = ? AND indicador = ?`,
    [competencia, indicador],
    (err, arquivo) => {
      if (err) return res.status(500).json({ erro: err.message });
      if (!arquivo) return res.status(404).json({ erro: "Arquivo não encontrado." });

      db.all(
        `SELECT * FROM dados_importados WHERE arquivo_id = ?`,
        [arquivo.id],
        (err, rows) => {
          if (err) return res.status(500).json({ erro: err.message });
          res.json(rows);
        }
      );
    }
  );
});


/* ================= START SERVER ================= */

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
