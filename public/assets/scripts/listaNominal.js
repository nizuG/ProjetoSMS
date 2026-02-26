const competenciaSelect = document.getElementById("competenciaSelect");
const indicadorSelect = document.getElementById("indicadorSelect");
const btnDicionario = document.getElementById("btnDicionario");
const popupDicionario = document.getElementById("popupDicionario");
const btnFecharPopup = document.getElementById("btnFecharPopup");
const popupConteudo = document.getElementById("popupConteudo");
const btnAnalisar = document.getElementById("btnAnalisar");
const resultadoAnalise = document.getElementById("resultadoAnalise");
const html = document.documentElement;
const resultado = document.getElementById("resultado");
const btnListaNominal = document.getElementById("btnListaNominal");
const ineSelect = document.getElementById("ineSelect");
ineSelect.disabled = true;
const buscaCpfInput = document.getElementById("buscaCpfTabela");
const buscaTabelaContainer = document.querySelector(".busca-tabela-container");
const tooltip = document.getElementById("tooltip");
let paginaAtual = 1;
const itensPorPagina = 10;
let dados = [];
const equipes = [
  { codigo: "0002233843", nome: "EAP CSII" },
  { codigo: "0002396068", nome: "EAP CSII 02" },
  { codigo: "0002396033", nome: "ESF CSII" },
  { codigo: "0001695223", nome: "ESF Estação" },
  { codigo: "0002555913", nome: "ESF Estação 02" },
  { codigo: "0002317206", nome: "EAP Estação 02" },
  { codigo: "0002143143", nome: "EAP Estação" },
  { codigo: "0002317184", nome: "EAP Mathias 02" },
  { codigo: "0002140004", nome: "EAP Mathias" },
  { codigo: "0002555905", nome: "ESF Mathias 02" },
  { codigo: "0001695231", nome: "ESF Mathias" },
  { codigo: "0002426005", nome: "ESF Santana" },
  { codigo: "0000349186", nome: "ESF Caporanga" },
  { codigo: "0000349151", nome: "ESF Aureliana 02" },
  { codigo: "0000349178", nome: "ESF Aureliana" },
  { codigo: "0000349100", nome: "ESF Fabiano 02" },
  { codigo: "0000349097", nome: "ESF Fabiano" },
  { codigo: "0001603957", nome: "ESF São João" },
  { codigo: "0001520857", nome: "ESF Parque" },
];
let dadosNormalizados = [];
let dadosBase = [];
let dadosFiltrados = [];

async function carregarOpcoes() {
  const response = await fetch("/api/lista-nominal/opcoes");
  dados = await response.json();

  const competenciasUnicas = [...new Set(dados.map((d) => d.competencia))];

  competenciasUnicas.forEach((comp) => {
    const option = document.createElement("option");
    option.value = comp;
    option.textContent = comp;
    competenciaSelect.appendChild(option);
  });
}

indicadorSelect.addEventListener("change", () => {
  resultadoAnalise.classList.remove("ativo");
  buscaTabelaContainer.style.display = "none";
  ineSelect.disabled = true;
  ineSelect.innerHTML = '<option value="todos">Todos</option>';
});

competenciaSelect.addEventListener("change", () => {
  indicadorSelect.innerHTML = '<option value="">Selecione</option>';
  resultadoAnalise.classList.remove("ativo");
  buscaTabelaContainer.style.display = "none";
  ineSelect.disabled = true;
  ineSelect.innerHTML = '<option value="todos">Todos</option>';
  tooltip.style.opacity = "1";


  const competenciaSelecionada = competenciaSelect.value;

  if (!competenciaSelecionada) {
    indicadorSelect.disabled = true;
    return;
  }

  const indicadores = dados
    .filter((d) => d.competencia === competenciaSelecionada)
    .map((d) => d.indicador);

  indicadores.forEach((ind) => {
    const option = document.createElement("option");
    option.value = ind;
    option.textContent = ind;
    indicadorSelect.appendChild(option);
  });

  indicadorSelect.disabled = false;
});
carregarOpcoes();

html.addEventListener("click", (e) => {
  if (
    popupDicionario.classList.contains("show") &&
    !popupDicionario.contains(e.target) &&
    e.target !== btnDicionario
  ) {
    popupDicionario.classList.remove("show");
  }
});

// Abre pop-up manualmente
btnDicionario.addEventListener("click", () => {
  popupDicionario.classList.toggle("show");
});

btnAnalisar.addEventListener("click", async () => {
  const competencia = competenciaSelect.value;
  const indicador = indicadorSelect.value;

  if (!competencia || !indicador) {
    alert("Selecione competência e indicador.");
    return;
  }

  popupConteudo.innerHTML = "Carregando...";

  try {
    // 1️⃣ Dicionário
    const responseDic = await fetch(
      `/api/lista-nominal/dicionario?competencia=${encodeURIComponent(competencia)}&indicador=${encodeURIComponent(indicador)}`
    );
    const dadosDicionario = await responseDic.json();
    renderizarPopupTabela(dadosDicionario, indicador);

    // 2️⃣ Dados
    const responseDados = await fetch(
      `/api/lista-nominal/analise?competencia=${encodeURIComponent(competencia)}&indicador=${encodeURIComponent(indicador)}`
    );
    const dadosBrutos = await responseDados.json();

    dadosBase = dadosBrutos
      .map((item) => {
        try {
          const parsed = JSON.parse(item.conteudo);
          const normalized = {};
          Object.entries(parsed).forEach(([k, v]) => {
            normalized[k.trim()] = v ? v.trim() : "";
          });
          return normalized;
        } catch {
          return null;
        }
      })
      .filter((item) => item !== null);

    console.log("Base completa:", dadosBase);

    // 3️⃣ Carrega INEs apenas com base completa
    carregarIneOptions(dadosBase);
    ineSelect.disabled = false;

    // 4️⃣ Aplica filtro
    aplicarFiltroINE(indicador);

    // 🔹 ZERA CPF
    buscaCpfInput.value = "";

    // exibe filtro cpf
    buscaTabelaContainer.style.display = "flex";
    tooltip.style.opacity = "0";

  } catch (error) {
    popupConteudo.innerHTML = "Erro ao buscar dados.";
    console.error(error);
  }
});

ineSelect.addEventListener("change", () => {
  aplicarFiltroINE(indicadorSelect.value);
  buscaCpfInput.value = "";
});

ineSelect.innerHTML = '<option value="todos">Todos</option>';

// Pega os códigos únicos dos dados carregados
function carregarIneOptions(dadosFonte) {
  if (!dadosFonte || dadosFonte.length === 0) return;

  const inesUnicos = [
    ...new Set(
      dadosFonte
        .map((d) => d.INE)
        .filter((ine) => ine && ine.trim() !== "")
    ),
  ];

  

  inesUnicos.forEach((codigo) => {
    const equipe = equipes.find((e) => e.codigo === codigo);

    const option = document.createElement("option");
    option.value = codigo;
    option.textContent = equipe ? equipe.nome : codigo;

    ineSelect.appendChild(option);
  });

  console.log("INEs carregados:", inesUnicos);
}

function aplicarFiltroINE(indicador) {
  const ineValor = ineSelect.value;

  if (ineValor === "todos") {
    dadosFiltrados = [...dadosBase];
  } else {
    dadosFiltrados = dadosBase.filter(
      (item) => item["INE"] === ineValor
    );
  }
  console.log("Filtrado:", dadosFiltrados);

  const porcentagens = calcularPorcentagem(dadosFiltrados, indicador);
  renderizarPorcentagens(porcentagens);

  paginaAtual = 1;
  renderizarTabelaCompleta(dadosFiltrados, paginaAtual);
  resultadoAnalise.classList.add("ativo");
}

function normalizarTexto(texto) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .toLowerCase()
    .replace(/\s+/g, "_"); // troca espaço por _
}

function ordenarColunas(colunas, indicador) {
  const indicadorNormalizado = normalizarTexto(indicador);
  const indicadorEspecial =
    "cuidado_da_mulher_e_do_homem_transgenero_na_prevencao_do_cancer";

  colunas = colunas.map((c) => c.trim());

  if (indicadorNormalizado === indicadorEspecial) {
    return colunas.sort((a, b) => {
      // colocar NM antes de DM dentro da mesma letra
      const [tipoA, letraA] = a.split(".");
      const [tipoB, letraB] = b.split(".");

      if (!letraA || !letraB) return 0;

      if (letraA !== letraB) {
        return letraA.localeCompare(letraB, undefined, { numeric: true });
      }

      if (tipoA === "NM" && tipoB === "DM") return -1;
      if (tipoA === "DM" && tipoB === "NM") return 1;

      return 0;
    });
  }
  // caso geral
  return colunas.sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true }),
  );
}

function renderizarPopupTabela(dados, indicadorSelecionado) {
  if (dados.length === 0) {
    popupConteudo.innerHTML = "<p>Nenhum registro encontrado.</p>";
    return;
  }

  const indicadorNormalizado = normalizarTexto(indicadorSelecionado);
  const indicadorEspecial =
    "cuidado_da_mulher_e_do_homem_transgenero_na_prevencao_do_cancer";
  let dadosOrdenados = [...dados];

  if (indicadorNormalizado === indicadorEspecial) {
    dadosOrdenados.sort((a, b) => {
      const colA = a.coluna.trim();
      const colB = b.coluna.trim();

      // Se for coluna final (sem ponto)
      const temPontoA = colA.includes(".");
      const temPontoB = colB.includes(".");

      if (!temPontoA && !temPontoB) {
        // ordenar finais: DM antes de NM
        if (colA === "DM") return -1;
        if (colA === "NM") return 1;
        if (colB === "DM") return 1;
        if (colB === "NM") return -1;
        return 0;
      }

      // Finais sempre ficam depois das letras
      if (!temPontoA) return 1;
      if (!temPontoB) return -1;

      const [tipoA, letraA] = colA.split(".");
      const [tipoB, letraB] = colB.split(".");

      // Ordena pela letra primeiro
      if (letraA !== letraB) {
        return letraA.localeCompare(letraB, undefined, { numeric: true });
      }

      // Dentro da mesma letra: NM antes de DM
      if (tipoA === "NM" && tipoB === "DM") return -1;
      if (tipoA === "DM" && tipoB === "NM") return 1;

      return 0;
    });
  } else {
    dadosOrdenados.sort((a, b) => {
      const colA = a.coluna.trim();
      const colB = b.coluna.trim();

      if (colA === "NM") return 1;
      if (colA === "DN") return 1;
      if (colB === "NM") return -1;
      if (colB === "DN") return -1;

      return colA.localeCompare(colB, undefined, { numeric: true });
    });
  }

  let tabela = "<table><thead><tr>";
  tabela += "<th>Coluna</th><th>Descrição</th>";
  tabela += "</tr></thead><tbody>";

  dadosOrdenados.forEach((item) => {
    tabela += `
                <tr>
                    <td>${item.coluna}</td>
                    <td>${item.descricao}</td>
                </tr>
            `;
  });
  tabela += "</tbody></table>";
  popupConteudo.innerHTML = tabela;
}

function calcularPorcentagem(dadosNormalizados, indicadorSelecionado) {
  if (!dadosNormalizados || dadosNormalizados.length === 0) return {};

  const indicadorNormalizado = indicadorSelecionado
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "_");

  const indicadorEspecial =
    "cuidado_da_mulher_e_do_homem_transgenero_na_prevencao_do_cancer";

  const resultado = {};

  // Identifica todas as colunas possíveis, ignorando campos pessoais
  const colunas = Object.keys(dadosNormalizados[0]).filter(
    (c) =>
      ![
        "CPF",
        "CNS",
        "Nascimento",
        "CNES",
        "INE",
        "Raça cor",
        "Sexo",
        "NM",
        "GESTANTE E PUERPERA ATIVA",
        "GESTANTE E PUERPERA FINALIZADA",
        "DN",
        "DN",
        "COM 2 ANOS",
        "ATE 2 ANOS",
      ].includes(c),
  );

  colunas.forEach((col) => {
    let total = 0;
    let atingiu = 0;

    // Caso especial
    if (indicadorNormalizado === indicadorEspecial) {
      const [tipo, letra] = col.split("."); // NM.A, NM.B, etc

      if (tipo === "NM") {
        // Só considera quem tem DN.LETRA preenchido
        const grupo = dadosNormalizados.filter(
          (linha) => linha[`DN.${letra}`] === "X",
        );
        total = grupo.length;
        atingiu = grupo.filter((linha) => linha[col] === "X").length;
      } else if (tipo === "DM") {
        // DM geral: todo mundo
        total = dadosNormalizados.length;
        atingiu = dadosNormalizados.filter(
          (linha) => linha[col] === "X",
        ).length;
      }
    } else {
      // Caso normal: A, B, C, …
      total = dadosNormalizados.length;
      atingiu = dadosNormalizados.filter((linha) => linha[col] === "X").length;
    }

    resultado[col] = total ? Math.round((atingiu / total) * 100) + "%" : "-";
  });

  return resultado;
}

function renderizarBarrasPorcentagem(porcentagens) {
  const container = document.getElementById("resultadoAnalise");

  if (!porcentagens || Object.keys(porcentagens).length === 0) {
    container.innerHTML = "<p>Nenhuma porcentagem calculada.</p>";
    return;
  }

  let html = "<h3>Resultados da Análise</h3>";

  // Filtra colunas que NÃO começam com DN.
  const colunasFiltradas = Object.entries(porcentagens).filter(
    ([col, _]) => !col.startsWith("DN."),
  );

  colunasFiltradas.forEach(([col, perc]) => {
    const valor = perc === "-" ? 0 : parseInt(perc); // transforma "30%" em 30
    html += `
      <div class="barra-container">
        <div class="barra-label">
          <span>${col}</span>
          <span>${perc}</span>
        </div>
        <div class="barra-progresso">
          <div class="barra-preenchida" style="width: ${valor}%;"></div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

// Função para renderizar a tabela completa dos dados normalizados
function renderizarPorcentagens(porcentagens) {
  const container = document.getElementById("resultadoAnalise");
  container.innerHTML =
    "<h3>Indicadores</h3><div class='barras-container'></div>";
  const barrasContainer = container.querySelector(".barras-container");

  Object.entries(porcentagens).forEach(([col, perc]) => {
    if (col.startsWith("DN.")) return; // ignora DN.*

    const valor = perc === "-" ? 0 : parseInt(perc);
    const barra = document.createElement("div");
    barra.className = "barra-progresso-item";
    barra.innerHTML = `
      <div class="barra-titulo">${col}</div>
      <div class="barra-fundo">
        <div class="barra-preenchida" style="width:${valor}%"></div>
      </div>
      <div class="barra-percentual">${perc}</div>
    `;
    barrasContainer.appendChild(barra);
  });
}

function renderizarTabelaCompleta(dados, pagina) {
  const container = document.getElementById("resultadoAnalise");
  const msg = container.querySelector(".msg-vazio");
  if (msg) msg.remove();
  if (!dados || dados.length === 0) {
    const p = document.createElement("p");
    p.classList.add("msg-vazio");
    p.textContent = "Nenhum dado para exibir.";
    container.appendChild(p);
    const tabelaExistente = container.querySelector(".scroll-tabela");
    if (tabelaExistente) tabelaExistente.remove();
    return;
  }

  const totalPaginas = Math.ceil(dados.length / itensPorPagina);
  const inicio = (pagina - 1) * itensPorPagina;
  const fim = inicio + itensPorPagina;
  const dadosPagina = dados.slice(inicio, fim);

  // Remove tabela anterior se existir
  const tabelaExistente = container.querySelector(".scroll-tabela");
  if (tabelaExistente) tabelaExistente.remove();
  const paginacaoExistente = container.querySelector(".paginacao");
  if (paginacaoExistente) paginacaoExistente.remove();

  let tabela =
    '<div class="scroll-tabela"><table class="tabela-completa"><thead><tr>';
  // Define as colunas que queremos mostrar
  const colunasPermitidas = ["CPF", "CNS", "Nascimento"];

  const colunasfinais = [
    "GESTANTE E PUERPERA ATIVA",
    "GESTANTE E PUERPERA FINALIZADA",
    "COM 2 ANOS",
    "ATE 2 ANOS",
  ];
  // Pega os indicadores presentes nos dados (NM.A, NM.B, ou A, B, C...)
  const todosIndicadores = Object.keys(dados[0]).filter(
    (c) => c.match(/^NM\.[A-Z]$/) || c.match(/^[A-Z]$/),
  );

  // Junta as colunas que serão exibidas
  const colunas = [...colunasPermitidas, ...todosIndicadores, ...colunasfinais];

  tabela += "<thead><tr>";

  // Cria os <th> para todas as colunas que existem no primeiro registro
  colunas.forEach((col) => {
    if (col in dados[0]) {
      tabela += `<th>${col}</th>`;
    }
  });

  tabela += "</tr></thead><tbody>";

  // Cria as linhas da página
  dadosPagina.forEach((item) => {
    tabela += "<tr>";
    colunas.forEach((col) => {
      if (col in dados[0]) {
        tabela += `<td>${item[col] !== undefined ? item[col] : ""}</td>`;
      }
    });
    tabela += "</tr>";
  });

  tabela += "</tbody></table></div>";
  container.innerHTML += tabela;

  // Paginação
  let paginacao = document.createElement("div");
  paginacao.className = "paginacao";
  paginacao.innerHTML = `
    <button id="prevPage" ${pagina === 1 ? "disabled" : ""}>Anterior</button>
    <span>Página ${pagina} de ${totalPaginas}</span>
    <button id="nextPage" ${pagina === totalPaginas ? "disabled" : ""}>Próxima</button>
  `;
  container.appendChild(paginacao);

  document.getElementById("prevPage").onclick = () => {
    if (paginaAtual > 1) {
      paginaAtual--;
      renderizarTabelaCompleta(dados, paginaAtual);
    }
  };
  document.getElementById("nextPage").onclick = () => {
    if (paginaAtual < totalPaginas) {
      paginaAtual++;
      renderizarTabelaCompleta(dados, paginaAtual);
    }
  };

  //container.scrollIntoView({ behavior: "smooth" });
}

function aplicarFiltroTabela() {
  const cpfBusca = buscaCpfInput.value.replace(/\D/g, "");

  let dadosParaTabela = dadosFiltrados;

  if (cpfBusca) {
    dadosParaTabela = dadosFiltrados.filter((item) =>
      item.CPF?.replace(/\D/g, "").includes(cpfBusca)
    );
  }

  paginaAtual = 1;
  renderizarTabelaCompleta(dadosParaTabela, paginaAtual);
}

buscaCpfInput.addEventListener("input", aplicarFiltroTabela);

ineSelect.addEventListener("mousemove", (e) => {
  tooltip.style.display = "block";
  tooltip.style.left = e.pageX + 10 + "px";
  tooltip.style.top = e.pageY + 10 + "px";
  tooltip.textContent = "Para filtrar por equipe, clique em \"Analisar\"";
});

ineSelect.addEventListener("mouseleave", () => {
  tooltip.style.display = "none";
});



