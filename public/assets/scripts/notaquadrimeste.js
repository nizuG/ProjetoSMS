let dadosGlobais = [];
let cardAbertoAtual = null;

function ordenarQuadrimestres(q) {
  if (!q) return 0;
  const [quad, ano] = q.split("/");
  return parseInt(ano) * 10 + parseInt(quad.replace("Q", ""));
}

function classificarNota(valor) {
  const v = Number(valor);
  if (isNaN(v)) return "regular";
  if (v < 2.5) return "regular";
  if (v < 4.9) return "suficiente";
  if (v < 7.5) return "bom";
  return "otimo";
}

function classificarNotaVinculo(valor) {
  const v = Number(valor);
  if (isNaN(v)) return "regular";
  if (v < 5) return "regular";
  if (v < 6.9) return "suficiente";
  if (v < 8.5) return "bom";
  return "otimo";
}

function classificarNotaVinculoDi(valor) {
  const v = Number(valor);
  if (isNaN(v)) return "regular";
  if (v < 0.75) return "regular";
  if (v < 1) return "suficiente";
  if (v < 2.5) return "bom";
  return "otimo";
}

function classificarNotaVinculoAC(valor) {
  const v = Number(valor);
  if (isNaN(v)) return "regular";
  if (v < 2) return "regular";
  if (v < 4) return "suficiente";
  if (v < 5.75) return "bom";
  return "otimo";
}

function calcularMedia(lista) {
  if (!lista || !lista.length) return 0;

  const soma = lista.reduce((acc, item) => {
    const nota = Number(item.nota);
    return acc + (isNaN(nota) ? 0 : nota);
  }, 0);

  return Number((soma / lista.length).toFixed(2));
}

function fecharCardAtual() {
  if (!cardAbertoAtual) return;

  cardAbertoAtual.classList.remove("ativo");

  const botaoAnterior = cardAbertoAtual
    .closest(".card-quadrimestre")
    .querySelector(".btn-toggle");

  if (botaoAnterior) {
    botaoAnterior.textContent = "Ver notas";
  }

  cardAbertoAtual = null;
}

function renderizar(dados) {
  const container = document.getElementById("containerTabelas");
  container.innerHTML = "";

  if (!dados || !dados.length) {
    container.innerHTML = "<p>Nenhum dado encontrado.</p>";
    return;
  }

  const quadrimestres = [...new Set(dados.map(d => d.quadrimestre))]
    .sort((a, b) => ordenarQuadrimestres(a) - ordenarQuadrimestres(b));

  quadrimestres.forEach(q => {

    const dadosQuad = dados.filter(d => d.quadrimestre === q);
    const media = calcularMedia(dadosQuad);
    const tipoMedia = classificarNota(media);

    const card = document.createElement("div");
    card.className = "card-quadrimestre";

    card.innerHTML = `
      <div class="card-header">
        <h2>${q}</h2>
        <div class="header-right">
          <span class="media-badge media-${tipoMedia}">
            Média: ${media}
          </span>
          <button class="btn-toggle">
            Ver notas
          </button>
        </div>
      </div>

      <div class="conteudo-notas">
        <table class="tabela-notas">
          <thead>
            <tr>
              <th>Equipe</th>
              <th>Nota</th>
            </tr>
          </thead>
          <tbody>
            ${dadosQuad.map(d => {
              const tipo = classificarNota(d.nota);
              return `
                <tr>
                  <td>${d.indicador || "-"}</td>
                  <td>
                    <span class="media-badge nota-${tipo}">
                      ${isNaN(d.nota) ? 0 : d.nota}
                    </span>
                  </td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    `;

    const botao = card.querySelector(".btn-toggle");
    const conteudo = card.querySelector(".conteudo-notas");

    botao.addEventListener("click", () => {

      const estaAberto = conteudo.classList.contains("ativo");

      if (estaAberto) {
        fecharCardAtual();
      } else {
        fecharCardAtual();
        conteudo.classList.add("ativo");
        botao.textContent = "Ocultar notas";
        cardAbertoAtual = conteudo;
      }

    });

    container.appendChild(card);
  });
}

async function carregarNotas() {
  try {
    const res = await fetch("/api/notas-quadrimestre");

    if (!res.ok) {
      throw new Error("Erro ao buscar dados");
    }

    const dadosBrutos = await res.json();

    const dados = dadosBrutos.map(item => ({
      quadrimestre: item.quadrimestre,
      indicador: item.nome_equipe,
      nota: Number(item.nota_final)
    }));

    dadosGlobais = dados;
    renderizar(dados);

  } catch (erro) {
    console.error("Erro:", erro);
  }
}

document.addEventListener("DOMContentLoaded", carregarNotas);