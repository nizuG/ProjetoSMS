document.addEventListener("DOMContentLoaded", () => {
  carregarQualidade();
  carregarVinculo();
  inicializarMenu();
});

/* ================= BUSCA DADOS ================= */

async function carregarQualidade() {
  try {
    const res = await fetch("/api/notas-mes");
    const dados = await res.json();
    renderizarQualidade(dados);
  } catch (e) {
    console.error("Erro ao carregar qualidade:", e);
  }
}

async function carregarVinculo() {
  try {
    const res = await fetch("/api/notas-vinculo-mes");
    const dados = await res.json();
    renderizarVinculo(dados);
  } catch (e) {
    console.error("Erro ao carregar vínculo:", e);
  }
}

/* ================= ORDENAR COMPETÊNCIA ================= */

function ordenarCompetenciasDesc(lista) {
  const mapaMes = {
    JAN: 1, FEV: 2, MAR: 3, ABR: 4, MAI: 5, JUN: 6,
    JUL: 7, AGO: 8, SET: 9, OUT: 10, NOV: 11, DEZ: 12,
  };

  return lista.sort((a, b) => {
    const [mesA, anoA] = a.split("/");
    const [mesB, anoB] = b.split("/");

    const dataA = new Date(2000 + parseInt(anoA), mapaMes[mesA] - 1);
    const dataB = new Date(2000 + parseInt(anoB), mapaMes[mesB] - 1);

    return dataB - dataA;
  });
}

/* ================= CLASSIFICAÇÃO QUALIDADE ================= */

function classeNotaQualidade(nota, indicador) {

  if (indicador !== "Mais Acesso à Atenção Primária à Saúde") {
    if (nota > 75) return "otimo";
    if (nota > 50) return "bom";
    if (nota > 25) return "suficiente";
    return "regular";
  }

  if (nota > 50 && nota <= 70) return "otimo";
  if (nota > 30 && nota <= 50) return "bom";
  if (nota > 10 && nota <= 30) return "suficiente";
  return "regular";
}

/* ================= CLASSIFICAÇÃO VÍNCULO ================= */

function classeNotaVinculo(nota, item) {

  if (
    item && item.pessoas_cadastradas > (item.parametro_populacional + item.parametro_populacional / 2)
  ) {
    return "regular";
  }

  if (nota > 8.5) return "otimo";
  if (nota >= 7) return "bom";
  if (nota >= 5) return "suficiente";
  return "regular";
}

function classeMediaVinculo(media) {
  if (media > 8.5) return "otimo";
  if (media >= 7) return "bom";
  if (media >= 5) return "suficiente";
  return "regular";
}

/* ===================================================== */
/* ================= QUALIDADE ========================== */
/* ===================================================== */

function renderizarQualidade(dados) {

  const container = document.getElementById("qualidade-container");
  container.innerHTML = "";

  if (!dados || dados.length === 0) {
    container.innerHTML = "<p>Sem dados disponíveis.</p>";
    return;
  }

  const agrupado = {};

  dados.forEach(item => {
    if (!agrupado[item.competencia]) agrupado[item.competencia] = {};
    if (!agrupado[item.competencia][item.indicador])
      agrupado[item.competencia][item.indicador] = [];
    agrupado[item.competencia][item.indicador].push(item);
  });

  const competencias = ordenarCompetenciasDesc(Object.keys(agrupado));

  competencias.forEach(comp => {

    const section = document.createElement("section");
    section.classList.add("secao-competencia");

    let html = `
      <h2 class="titulo-competencia">${comp}</h2>
      <table class="tabela-executiva">
        <thead>
          <tr>
            <th>Indicador</th>
            <th>Média</th>
          </tr>
        </thead>
        <tbody>
    `;

    Object.keys(agrupado[comp]).forEach(indicador => {

      const equipes = agrupado[comp][indicador];
      const media =
        equipes.reduce((acc, e) => acc + e.nota_final, 0) /
        equipes.length;

      const classeMedia = classeNotaQualidade(media, indicador);

      html += `
        <tr class="linha-indicador">
          <td>${indicador}</td>
          <td>
            <span class="media-badge media-${classeMedia}">
              ${media.toFixed(2)}
            </span>
          </td>
        </tr>

        <tr class="linha-equipes oculto">
          <td colspan="2">
            <table class="tabela-equipes">
              ${equipes.map(eq => `
                <tr>
                  <td>${eq.nome_equipe}</td>
                  <td>
                    <span class="media-badge nota-${classeNotaQualidade(eq.nota_final, indicador)}">
                      ${eq.nota_final.toFixed(2)}
                    </span>
                  </td>
                </tr>
              `).join("")}
            </table>
          </td>
        </tr>
      `;
    });

    html += "</tbody></table>";
    section.innerHTML = html;
    container.appendChild(section);

    const linhas = section.querySelectorAll(".linha-indicador");
    const detalhes = section.querySelectorAll(".linha-equipes");

    linhas.forEach((linha, index) => {
      linha.addEventListener("click", () => {
        detalhes.forEach((d, i) => {
          if (i !== index) d.classList.add("oculto");
        });
        detalhes[index].classList.toggle("oculto");
      });
    });

  });
}

/* ===================================================== */
/* ================= VÍNCULO ============================ */
/* ===================================================== */

function renderizarVinculo(dados) {

  const container = document.getElementById("vinculo-container");
  container.innerHTML = "";

  if (!dados || dados.length === 0) {
    container.innerHTML = "<p>Sem dados disponíveis.</p>";
    return;
  }

  const agrupado = {};

  dados.forEach(item => {
    if (!agrupado[item.competencia])
      agrupado[item.competencia] = [];
    agrupado[item.competencia].push(item);
  });

  const competencias = ordenarCompetenciasDesc(Object.keys(agrupado));

  competencias.forEach(comp => {

    const equipes = agrupado[comp];
    const media =
      equipes.reduce((acc, e) => acc + Number(e.nota_final), 0) /
      equipes.length;

    const classeMedia = classeMediaVinculo(media);

    const section = document.createElement("section");
    section.classList.add("secao-competencia");

    let html = `
      <h2 class="titulo-competencia">${comp}</h2>
      <table class="tabela-executiva">
        <thead>
          <tr>
            <th>Indicador</th>
            <th>Média</th>
          </tr>
        </thead>
        <tbody>

        <tr class="linha-indicador">
          <td>Vínculo e Acompanhamento</td>
          <td>
            <span class="media-badge media-${classeMedia}">
              ${media.toFixed(2)}
            </span>
          </td>
        </tr>

        <tr class="linha-equipes oculto">
          <td colspan="2">
            <table class="tabela-equipes">
              ${equipes.map(eq => {

                const parametro = Number(eq.parametro_populacional);
                const vinculados = Number(eq.pessoas_cadastradas);
                const limite = parametro + parametro / 2;

                const parametroClasse =
                  limite < vinculados
                    ? "style='color:#ef4444;font-weight:600;'"
                    : "";

                return `
                  <tr>
                    <td ${parametroClasse}>
                      ${eq.nome_equipe}<br>
                      <small >
                        Vinculados: ${vinculados} |
                        Parâmetro:
                        <span>${parametro}</span>
                      </small>
                    </td>
                    <td>
                      <span class="media-badge nota-${classeNotaVinculo(eq.nota_final, eq)}">
                        ${Number(eq.nota_final).toFixed(2)}
                      </span>
                    </td>
                  </tr>
                `;
              }).join("")}
            </table>
          </td>
        </tr>
      </tbody>
      </table>
    `;

    section.innerHTML = html;
    container.appendChild(section);

    const linha = section.querySelector(".linha-indicador");
    const detalhe = section.querySelector(".linha-equipes");

    linha.addEventListener("click", () => {
      document
        .querySelectorAll("#vinculo-container .linha-equipes")
        .forEach(el => {
          if (el !== detalhe) el.classList.add("oculto");
        });

      detalhe.classList.toggle("oculto");
    });

  });
}

/* ================= MENU ================= */

function inicializarMenu() {
  const botoes = document.querySelectorAll(".btn-menu");

  botoes.forEach(botao => {
    botao.addEventListener("click", () => {

      botoes.forEach(b => b.classList.remove("ativo"));
      botao.classList.add("ativo");

      document
        .querySelectorAll(".secao-notas")
        .forEach(sec => sec.classList.add("oculto"));

      const alvo = botao.getAttribute("data-alvo");
      document.getElementById(alvo).classList.remove("oculto");

    });
  });
}