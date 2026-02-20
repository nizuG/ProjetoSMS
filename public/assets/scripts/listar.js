async function carregarArquivos() {

    const response = await fetch('/api/arquivos');
    const dados = await response.json();

    const container = document.getElementById('container');
    container.innerHTML = '';

    if (!dados.length) {
        container.innerHTML = '<p>Nenhum arquivo encontrado.</p>';
        return;
    }

    // Agrupar por competência
    const agrupado = {};

    dados.forEach(item => {

        if (!agrupado[item.competencia]) {
            agrupado[item.competencia] = [];
        }

        agrupado[item.competencia].push(item);
    });

    // Renderizar
    Object.keys(agrupado).forEach(comp => {

        const divComp = document.createElement('div');
        divComp.classList.add('competencia');

        const titulo = document.createElement('h2');
        titulo.textContent = `Competência: ${comp}`;
        divComp.appendChild(titulo);

        agrupado[comp].forEach(arq => {

            const divInd = document.createElement('div');
            divInd.classList.add('indicador');

            divInd.innerHTML = `
                <strong>Indicador:</strong> ${arq.indicador}
            `;

            divComp.appendChild(divInd);
        });

        container.appendChild(divComp);
    });
}

carregarArquivos();
