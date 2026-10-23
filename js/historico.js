
const API_MANUTENCOES = "https://localhost:7037/api/Manutencoes";
const API_VIATURAS = "https://localhost:7037/api/Viaturas";

const tabela = document.getElementById("tabelaHistorico");
const campoPesquisa = document.getElementById("pesquisa");
const filtroTipo = document.getElementById("filtroTipo");
const filtroData = document.getElementById("filtroData");
const detalhesRegistro = document.getElementById("detalhesRegistro");

let historico = [];
let viaturas = [];

function escaparHTML(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, caractere => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[caractere]);
}

async function buscarAPI(url) {
    const resposta = await fetch(url);

    if (!resposta.ok) {
        throw new Error(`Erro ao consultar a API: ${resposta.status}`);
    }

    return resposta.json();
}

function primeiroValor(objeto, nomes, padrao = "") {
    for (const nome of nomes) {
        if (
            objeto &&
            objeto[nome] !== undefined &&
            objeto[nome] !== null &&
            objeto[nome] !== ""
        ) {
            return objeto[nome];
        }
    }

    return padrao;
}

function normalizarTipo(valor) {
    const texto = String(valor || "").toLowerCase();

    if (texto.includes("prevent")) return "Preventiva";
    if (texto.includes("corret")) return "Corretiva";

    return valor || "Não informado";
}

function encontrarViatura(id) {
    return viaturas.find(v => Number(v.id) === Number(id));
}

function nomeDaViatura(item) {
    const identificacao = primeiroValor(
        item,
        ["viatura", "Viatura"],
        ""
    );

    if (typeof identificacao === "object" && identificacao !== null) {
        const placa = primeiroValor(identificacao, ["placa", "Placa"], "");
        const marca = primeiroValor(identificacao, ["marca", "Marca"], "");
        const modelo = primeiroValor(identificacao, ["modelo", "Modelo"], "");

        return `${placa} - ${marca} ${modelo}`.trim();
    }

    if (identificacao && typeof identificacao !== "number") {
        return String(identificacao);
    }

    const viaturaId = primeiroValor(
        item,
        ["viaturaId", "ViaturaId"],
        identificacao
    );

    const viatura = encontrarViatura(viaturaId);

    if (!viatura) {
        return "Viatura não identificada";
    }

    return `${viatura.placa} - ${viatura.marca} ${viatura.modelo}`;
}

function normalizarManutencao(item) {
    return {
        id: primeiroValor(item, ["id", "Id"], ""),
        viatura: nomeDaViatura(item),
        tipo: normalizarTipo(
            primeiroValor(item, ["tipo", "Tipo"], "")
        ),
        servico: primeiroValor(
            item,
            ["descricao", "Descricao", "servico", "Servico"],
            "Serviço de manutenção"
        ),
        data: primeiroValor(
            item,
            ["dataManutencao", "DataManutencao", "data", "Data"],
            ""
        ),
        quilometragem: Number(
            primeiroValor(item, ["quilometragem", "Quilometragem"], 0)
        ),
        custo: Number(
            primeiroValor(item, ["custo", "Custo"], 0)
        ) || 0,
        responsavel: primeiroValor(
            item,
            ["responsavel", "Responsavel"],
            "Não informado"
        ),
        observacoes: primeiroValor(
            item,
            ["observacoes", "Observacoes", "observacao", "Observacao"],
            "Nenhuma observação registrada."
        ),
        status: primeiroValor(item, ["status", "Status"], "")
    };
}

async function carregarHistorico() {
    try {
        const resultados = await Promise.all([
            buscarAPI(API_MANUTENCOES),
            buscarAPI(API_VIATURAS)
        ]);

        viaturas = resultados[1];
        historico = resultados[0].map(normalizarManutencao);

        renderizarHistorico();
    } catch (erro) {
        console.error("Erro ao carregar histórico:", erro);

        tabela.innerHTML = `
            <tr>
                <td colspan="8" class="vazio">
                    Não foi possível carregar o histórico.
                    Verifique se a API está executando.
                </td>
            </tr>
        `;

        document.getElementById("quantidadeRegistros").textContent =
            "Não foi possível carregar os registros.";

        alert(
            "Erro ao carregar o histórico. " +
            "Confira se o backend está aberto e tente novamente."
        );
    }
}

function formatarData(data) {
    if (!data) return "—";

    const texto = String(data);

    if (/^\d{4}-\d{2}-\d{2}/.test(texto)) {
        const partes = texto.substring(0, 10).split("-");
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    const dataConvertida = new Date(texto);

    if (Number.isNaN(dataConvertida.getTime())) {
        return texto;
    }

    return dataConvertida.toLocaleDateString("pt-BR");
}

function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function formatarKm(valor) {
    return `${Number(valor || 0).toLocaleString("pt-BR")} km`;
}

function classeTipo(tipo) {
    return tipo === "Preventiva" ? "preventiva" : "corretiva";
}

function atualizarIndicadores(registros) {
    const concluidas = registros.filter(item => {
        const status = String(item.status).toLowerCase();

        return [
            "concluída",
            "concluida",
            "concluído",
            "concluido",
            "concluída"
        ].includes(status);
    }).length;

    const viaturasUnicas = new Set(
        registros
            .map(item => item.viatura.toLowerCase().trim())
            .filter(nome => nome && nome !== "viatura não identificada")
    );

    const custoTotal = registros.reduce(
        (soma, item) => soma + item.custo,
        0
    );

    document.getElementById("totalRegistros").textContent =
        registros.length;

    document.getElementById("totalConcluidas").textContent =
        concluidas;

    document.getElementById("custoTotal").textContent =
        formatarMoeda(custoTotal);

    document.getElementById("totalViaturas").textContent =
        viaturasUnicas.size;
}

function mostrarDetalhes(item) {
    detalhesRegistro.innerHTML = `
        <div class="detalhes-grade">
            <div class="detalhe-item">
                <label>Viatura</label>
                <p>${escaparHTML(item.viatura)}</p>
            </div>

            <div class="detalhe-item">
                <label>Tipo de manutenção</label>
                <p>${escaparHTML(item.tipo)}</p>
            </div>

            <div class="detalhe-item">
                <label>Serviço realizado</label>
                <p>${escaparHTML(item.servico)}</p>
            </div>

            <div class="detalhe-item">
                <label>Data</label>
                <p>${escaparHTML(formatarData(item.data))}</p>
            </div>

            <div class="detalhe-item">
                <label>Quilometragem</label>
                <p>${escaparHTML(formatarKm(item.quilometragem))}</p>
            </div>

            <div class="detalhe-item">
                <label>Custo</label>
                <p>${escaparHTML(formatarMoeda(item.custo))}</p>
            </div>

            <div class="detalhe-item">
                <label>Responsável</label>
                <p>${escaparHTML(item.responsavel)}</p>
            </div>

            <div class="detalhe-item">
                <label>Status</label>
                <p>${escaparHTML(item.status || "Não informado")}</p>
            </div>

            <div class="detalhe-item">
                <label>Observações</label>
                <p>${escaparHTML(item.observacoes)}</p>
            </div>
        </div>
    `;
}

function renderizarHistorico() {
    const pesquisa = campoPesquisa.value.trim().toLowerCase();
    const tipoSelecionado = filtroTipo.value;
    const dataSelecionada = filtroData.value;

    const filtrados = historico.filter(item => {
        const correspondePesquisa = [
            item.viatura,
            item.tipo,
            item.servico,
            item.responsavel
        ].some(valor =>
            String(valor).toLowerCase().includes(pesquisa)
        );

        const correspondeTipo =
            !tipoSelecionado || item.tipo === tipoSelecionado;

        const correspondeData =
            !dataSelecionada ||
            String(item.data).substring(0, 10) === dataSelecionada;

        return correspondePesquisa &&
            correspondeTipo &&
            correspondeData;
    });

    atualizarIndicadores(historico);

    if (filtrados.length === 0) {
        tabela.innerHTML = `
            <tr>
                <td colspan="8" class="vazio">
                    Nenhum registro encontrado para os filtros selecionados.
                </td>
            </tr>
        `;
    } else {
        tabela.innerHTML = filtrados.map((item, indice) => `
            <tr>
                <td><strong>${escaparHTML(item.viatura)}</strong></td>

                <td>
                    <span class="tipo ${classeTipo(item.tipo)}">
                        ${escaparHTML(item.tipo)}
                    </span>
                </td>

                <td>${escaparHTML(item.servico)}</td>

                <td>${escaparHTML(formatarData(item.data))}</td>

                <td>${escaparHTML(formatarKm(item.quilometragem))}</td>

                <td>${escaparHTML(formatarMoeda(item.custo))}</td>

                <td>${escaparHTML(item.responsavel)}</td>

                <td>
                    <button
                        type="button"
                        class="botao-detalhes"
                        data-indice="${indice}"
                    >
                        Ver detalhes
                    </button>
                </td>
            </tr>
        `).join("");
    }

    document.getElementById("quantidadeRegistros").textContent =
        `${filtrados.length} ${
            filtrados.length === 1
                ? "registro encontrado"
                : "registros encontrados"
        }`;

    tabela.querySelectorAll("[data-indice]").forEach(botao => {
        botao.addEventListener("click", () => {
            const item = filtrados[Number(botao.dataset.indice)];

            if (item) {
                mostrarDetalhes(item);

                detalhesRegistro.scrollIntoView({
                    behavior: "smooth",
                    block: "nearest"
                });
            }
        });
    });
}

campoPesquisa.addEventListener("input", renderizarHistorico);
filtroTipo.addEventListener("change", renderizarHistorico);
filtroData.addEventListener("change", renderizarHistorico);

carregarHistorico();
