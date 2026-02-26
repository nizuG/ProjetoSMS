let cardAbertoVinculo = null;

function renderizarVinculo(dados) {
  const container = document.getElementById("containerVinculo");
  container.innerHTML = "";

  const quadrimestres = [...new Set(dados.map(d => d.quadrimestre))]
    .sort((a, b) => ordenarQuadrimestres(a) - ordenarQuadrimestres(b));

  quadrimestres.forEach((q, index) => {

    const dadosQuad = dados.filter(d => d.quadrimestre === q);

    const media = calcularMedia(
      dadosQuad.map(d => ({ nota: d.nota_final }))
    );

    const tipoMedia = classificarNotaVinculo(media);

    const card = document.createElement("div");
    card.className = "card-vinculo"; // 👈 CLASSE DIFERENTE

    card.innerHTML = `
      <div class="card-header">
        <h2>${q}</h2>
        <div class="header-right">
          <span class="media-badge media-${tipoMedia}">
            Média Final: ${media}
          </span>
          <button class="btn-toggle-vinculo">
            Ver notas
          </button>
        </div>
      </div>

      <div class="conteudo-vinculo">
        <table class="tabela-notas">
          <thead>
            <tr>
              <th>Equipe</th>
              <th>Cadastro</th>
              <th>Acompanhamento</th>
              <th>Final</th>
            </tr>
          </thead>
          <tbody>
            ${dadosQuad.map(d => `
              <tr>
                <td>${d.nome_equipe}</td>
                <td>
                  <span class="media-badge nota-${classificarNotaVinculoDi(d.dimensao_cadastro)}">
                    ${d.dimensao_cadastro}
                  </span>
                </td>
                <td>
                  <span class="media-badge nota-${classificarNotaVinculoAC(d.dimensao_acompanhamento)}">
                    ${d.dimensao_acompanhamento}
                  </span>
                </td>
                <td>
                  <span class="media-badge nota-${classificarNotaVinculo(d.nota_final)}">
                    ${d.nota_final}
                  </span>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;

    const botao = card.querySelector(".btn-toggle-vinculo");
    const conteudo = card.querySelector(".conteudo-vinculo");

    botao.addEventListener("click", () => {

      // Fecha o que estiver aberto
      if (cardAbertoVinculo && cardAbertoVinculo !== conteudo) {
        cardAbertoVinculo.classList.remove("ativo");
        cardAbertoVinculo
          .closest(".card-vinculo")
          .querySelector(".btn-toggle-vinculo")
          .textContent = "Ver notas";
      }

      const aberto = conteudo.classList.contains("ativo");

      if (aberto) {
        conteudo.classList.remove("ativo");
        botao.textContent = "Ver notas";
        cardAbertoVinculo = null;
      } else {
        conteudo.classList.add("ativo");
        botao.textContent = "Ocultar notas";
        cardAbertoVinculo = conteudo;
      }

    });

    container.appendChild(card);
  });
}
async function carregarVinculo() {
  try {
    const res = await fetch("/api/notas-vinculo");

    if (!res.ok) {
      throw new Error("Erro ao buscar vínculo");
    }

    const dados = await res.json();

    renderizarVinculo(dados);

  } catch (erro) {
    console.error("Erro vínculo:", erro);
  }
}

carregarVinculo();