
const API_PREVENTIVAS = "https://localhost:7037/api/Preventivas";
const API_VIATURAS = "https://localhost:7037/api/Viaturas";

const modal = document.getElementById("modalPreventiva");
const formulario = document.getElementById("formPreventiva");
const tabela = document.getElementById("tabelaPreventivas");

const campoId = document.getElementById("idPreventiva");
const campoViatura = document.getElementById("viatura");
const campoServico = document.getElementById("servico");
const campoData = document.getElementById("dataPrevista");
const campoKm = document.getElementById("quilometragem");
const campoStatus = document.getElementById("status");
const campoObservacoes = document.getElementById("observacoes");

let preventivas = [];
let viaturas = [];

async function requisicao(url, opcoes = {}) {
    const resposta = await fetch(url, {
        ...opcoes,
        headers: {
            "Content-Type": "application/json",
            ...opcoes.headers
        }
    });

    if (!resposta.ok) {
        let mensagem = `Erro HTTP ${resposta.status}.`;

        try {
            const erro = await resposta.json();
            mensagem = erro.mensagem || erro.title || mensagem;
        } catch {
            // Mantém a mensagem padrão.
        }

        throw new Error(mensagem);
    }

    if (resposta.status === 204) {
        return null;
    }

    return resposta.json();
}

function escaparHTML(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, caractere => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[caractere]);
}

function dataLocalHoje() {
    const agora = new Date();

    return [
        agora.getFullYear(),
        String(agora.getMonth() + 1).padStart(2, "0"),
        String(agora.getDate()).padStart(2, "0")
    ].join("-");
}

function obterStatus(item) {
    if (item.concluida) {
        return "Concluída";
    }

    const data = String(item.dataPrevista || "").slice(0, 10);

    if (data && data < dataLocalHoje()) {
        return "Atrasada";
    }

    return "Agendada";
}

function formatarData(data) {
    if (!data) return "—";

    const partes = String(data).slice(0, 10).split("-");

    if (partes.length !== 3) return data;

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function classeStatus(status) {
    const classes = {
        "Agendada": "agendada",
        "Em andamento": "em-andamento",
        "Concluída": "concluida",
        "Atrasada": "atrasada"
    };

    return classes[status] || "agendada";
}

function buscarViatura(id) {
    return viaturas.find(v => Number(v.id) === Number(id));
}

function nomeViatura(id) {
    const viatura = buscarViatura(id);

    if (!viatura) {
        return `Viatura #${id}`;
    }

    return `${viatura.placa} - ${viatura.marca} ${viatura.modelo}`;
}

async function carregarDados() {
    try {
        const resultados = await Promise.all([
            requisicao(API_PREVENTIVAS),
            requisicao(API_VIATURAS)
        ]);

        preventivas = resultados[0];
        viaturas = resultados[1];

        prepararCampoViatura();
        renderizarTabela();
    } catch (erro) {
        console.error("Erro ao carregar preventivas:", erro);

        tabela.innerHTML = `
            <tr>
                <td colspan="6" class="vazio">
                    Não foi possível carregar as preventivas.
                    Confira se a API está executando.
                </td>
            </tr>
        `;

        alert(
            "Não foi possível carregar as preventivas. " +
            "Confira se o backend está aberto e tente novamente."
        );
    }
}

function prepararCampoViatura() {
    if (!campoViatura) return;

    if (campoViatura.tagName === "SELECT") {
        campoViatura.innerHTML = `
            <option value="">Selecione uma viatura</option>
            ${viaturas.map(v => `
                <option value="${v.id}">
                    ${escaparHTML(nomeViatura(v.id))}
                </option>
            `).join("")}
        `;

        return;
    }

    let lista = document.getElementById("listaViaturasPreventivas");

    if (!lista) {
        lista = document.createElement("datalist");
        lista.id = "listaViaturasPreventivas";
        document.body.appendChild(lista);
    }

    campoViatura.setAttribute("list", lista.id);

    lista.innerHTML = viaturas.map(v => `
        <option value="${escaparHTML(nomeViatura(v.id))}"></option>
    `).join("");
}

function obterViaturaId() {
    const valor = campoViatura.value.trim();

    if (campoViatura.tagName === "SELECT") {
        return Number(valor);
    }

    const encontrada = viaturas.find(v => {
        return nomeViatura(v.id).toLowerCase() === valor.toLowerCase()
            || String(v.placa).toLowerCase() === valor.toLowerCase();
    });

    return encontrada ? Number(encontrada.id) : 0;
}

function atualizarIndicadores() {
    const hoje = dataLocalHoje();

    const limite = new Date();
    limite.setHours(0, 0, 0, 0);
    limite.setDate(limite.getDate() + 30);

    const dataLimite = [
        limite.getFullYear(),
        String(limite.getMonth() + 1).padStart(2, "0"),
        String(limite.getDate()).padStart(2, "0")
    ].join("-");

    const atrasadas = preventivas.filter(
        item => obterStatus(item) === "Atrasada"
    ).length;

    const concluidas = preventivas.filter(
        item => item.concluida
    ).length;

    const proximas = preventivas.filter(item => {
        const data = String(item.dataPrevista || "").slice(0, 10);

        return !item.concluida &&
            data >= hoje &&
            data <= dataLimite;
    }).length;

    document.getElementById("totalPreventivas").textContent =
        preventivas.length;

    document.getElementById("proximasPreventivas").textContent =
        proximas;

    document.getElementById("atrasadasPreventivas").textContent =
        atrasadas;

    document.getElementById("concluidasPreventivas").textContent =
        concluidas;
}

function renderizarTabela() {
    const campoPesquisa = document.getElementById("pesquisa");
    const campoFiltro = document.getElementById("filtroStatus");

    const pesquisa = campoPesquisa.value.trim().toLowerCase();
    const filtroStatus = campoFiltro.value;

    const filtradas = preventivas.filter(item => {
        const statusAtual = obterStatus(item);
        const nome = nomeViatura(item.viaturaId).toLowerCase();
        const servico = String(item.descricao || "").toLowerCase();

        const correspondePesquisa =
            nome.includes(pesquisa) ||
            servico.includes(pesquisa);

        const correspondeStatus =
            !filtroStatus || statusAtual === filtroStatus;

        return correspondePesquisa && correspondeStatus;
    });

    if (filtradas.length === 0) {
        tabela.innerHTML = `
            <tr>
                <td colspan="6" class="vazio">
                    Nenhuma preventiva encontrada.
                </td>
            </tr>
        `;
    } else {
        tabela.innerHTML = filtradas.map(item => {
            const statusAtual = obterStatus(item);
            const km = item.quilometragemPrevista;

            return `
                <tr>
                    <td>
                        <strong>${escaparHTML(nomeViatura(item.viaturaId))}</strong>
                    </td>

                    <td>${escaparHTML(item.descricao)}</td>

                    <td>${formatarData(item.dataPrevista)}</td>

                    <td>
                        ${km == null
                            ? "—"
                            : Number(km).toLocaleString("pt-BR") + " km"}
                    </td>

                    <td>
                        <span class="status ${classeStatus(statusAtual)}">
                            ${escaparHTML(statusAtual)}
                        </span>
                    </td>

                    <td>
                        <div class="acoes">
                            ${!item.concluida ? `
                                <button
                                    class="botao-acao"
                                    type="button"
                                    data-acao="concluir"
                                    data-id="${item.id}"
                                    title="Concluir preventiva"
                                    aria-label="Concluir preventiva"
                                >✓</button>
                            ` : ""}

                            <button
                                class="botao-acao excluir"
                                type="button"
                                data-acao="excluir"
                                data-id="${item.id}"
                                title="Excluir preventiva"
                                aria-label="Excluir preventiva"
                            >⌫</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join("");
    }

    document.getElementById("totalRegistros").textContent =
        `${filtradas.length} ${
            filtradas.length === 1
                ? "registro encontrado"
                : "registros encontrados"
        }`;

    atualizarIndicadores();
}

function abrirModal() {
    formulario.reset();
    campoId.value = "";

    if (campoStatus) {
        campoStatus.value = "Agendada";
    }

    document.getElementById("tituloModal").textContent =
        "Cadastrar preventiva";

    modal.classList.add("aberto");
    campoViatura.focus();
}

function fecharModal() {
    modal.classList.remove("aberto");
}

async function excluirPreventiva(id) {
    const item = preventivas.find(
        p => Number(p.id) === Number(id)
    );

    if (!item) return;

    const confirmar = confirm(
        `Deseja excluir a preventiva "${item.descricao}" ` +
        `da viatura "${nomeViatura(item.viaturaId)}"?`
    );

    if (!confirmar) return;

    try {
        await requisicao(`${API_PREVENTIVAS}/${id}`, {
            method: "DELETE"
        });

        await carregarDados();
    } catch (erro) {
        console.error(erro);
        alert("Não foi possível excluir a preventiva: " + erro.message);
    }
}

async function concluirPreventiva(id) {
    const confirmar = confirm(
        "Deseja marcar esta preventiva como concluída?"
    );

    if (!confirmar) return;

    try {
        await requisicao(`${API_PREVENTIVAS}/${id}/concluir`, {
            method: "PUT"
        });

        await carregarDados();
    } catch (erro) {
        console.error(erro);
        alert("Não foi possível concluir a preventiva: " + erro.message);
    }
}

document.getElementById("abrirModal").addEventListener(
    "click",
    abrirModal
);

document.getElementById("fecharModal").addEventListener(
    "click",
    fecharModal
);

document.getElementById("cancelarModal").addEventListener(
    "click",
    fecharModal
);

modal.addEventListener("click", evento => {
    if (evento.target === modal) {
        fecharModal();
    }
});

document.addEventListener("keydown", evento => {
    if (evento.key === "Escape") {
        fecharModal();
    }
});

formulario.addEventListener("submit", async evento => {
    evento.preventDefault();

    const viaturaId = obterViaturaId();
    const descricao = campoServico.value.trim();
    const dataPrevista = campoData.value;
    const quilometragemPrevista =
        campoKm.value.trim() === "" ? null : Number(campoKm.value);

    if (!viaturaId || !buscarViatura(viaturaId)) {
        alert("Selecione uma viatura cadastrada na lista.");
        campoViatura.focus();
        return;
    }

    if (!descricao || !dataPrevista) {
        alert("Preencha a descrição do serviço e a data prevista.");
        return;
    }

    if (
        quilometragemPrevista !== null &&
        (!Number.isFinite(quilometragemPrevista) ||
            quilometragemPrevista < 0)
    ) {
        alert("Informe uma quilometragem válida.");
        campoKm.focus();
        return;
    }

    const dados = {
        viaturaId,
        descricao,
        dataPrevista: `${dataPrevista}T00:00:00`,
        quilometragemPrevista,
        concluida: false
    };

    try {
        await requisicao(API_PREVENTIVAS, {
            method: "POST",
            body: JSON.stringify(dados)
        });

        fecharModal();
        await carregarDados();

        alert("Preventiva cadastrada com sucesso!");
    } catch (erro) {
        console.error("Erro ao cadastrar preventiva:", erro);
        alert("Não foi possível cadastrar a preventiva: " + erro.message);
    }
});

tabela.addEventListener("click", evento => {
    const botao = evento.target.closest("button[data-acao]");

    if (!botao) return;

    const id = botao.dataset.id;

    if (botao.dataset.acao === "excluir") {
        excluirPreventiva(id);
    }

    if (botao.dataset.acao === "concluir") {
        concluirPreventiva(id);
    }
});

document.getElementById("pesquisa").addEventListener(
    "input",
    renderizarTabela
);

document.getElementById("filtroStatus").addEventListener(
    "change",
    renderizarTabela
);

carregarDados();
