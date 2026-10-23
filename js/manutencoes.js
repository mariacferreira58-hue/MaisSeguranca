
document.addEventListener("DOMContentLoaded", () => {
    const $ = id => document.getElementById(id);

    const API_MANUTENCOES = "https://localhost:7037/api/Manutencoes";
    const API_VIATURAS = "https://localhost:7037/api/Viaturas";

    const formulario = $("formManutencao");
    const modal = $("modalManutencao");
    const lista = $("listaManutencoes");
    const mensagemVazia = $("mensagemVazia");
    const notificacao = $("notificacao");

    let viaturas = [];
    let manutencoes = [];
    let temporizadorNotificacao;

    // ==================================================
    // COMUNICAÇÃO COM A API
    // ==================================================

    async function requisicaoAPI(url, opcoes = {}) {
        const resposta = await fetch(url, {
            ...opcoes,
            headers: {
                "Content-Type": "application/json",
                ...opcoes.headers
            }
        });

        if (!resposta.ok) {
            let mensagem = `Erro ${resposta.status} ao acessar a API.`;

            try {
                const erro = await resposta.json();
                mensagem = erro.mensagem ||
                    erro.title ||
                    erro.message ||
                    mensagem;
            } catch {
                // Mantém a mensagem padrão.
            }

            throw new Error(mensagem);
        }

        if (resposta.status === 204) {
            return null;
        }

        const texto = await resposta.text();

        return texto ? JSON.parse(texto) : null;
    }

    async function carregarViaturas() {
        const dados = await requisicaoAPI(API_VIATURAS);

        viaturas = Array.isArray(dados) ? dados : [];

        atualizarOpcoesViaturas();

        return viaturas;
    }

    async function carregarManutencoes() {
        const dados = await requisicaoAPI(API_MANUTENCOES);

        manutencoes = (Array.isArray(dados) ? dados : [])
            .map(manutencao => ({
                ...manutencao,
                id: Number(manutencao.id),
                viaturaId: Number(manutencao.viaturaId),
                dataManutencao: String(
                    manutencao.dataManutencao || ""
                ).slice(0, 10),
                quilometragem: Number(manutencao.quilometragem || 0),
                custo: Number(manutencao.custo || 0),
                responsavel: manutencao.responsavel || "",
                status: manutencao.status || "Pendente",
                tipo: manutencao.tipo || "",
                descricao: manutencao.descricao || ""
            }));

        renderizar();
    }

    async function carregarDados() {
        try {
            await Promise.all([
                carregarViaturas(),
                carregarManutencoes()
            ]);
        } catch (erro) {
            console.error("Erro ao carregar dados:", erro);

            mostrarNotificacao(
                "Não foi possível carregar os dados. Confira se o backend está iniciado."
            );

            mensagemVazia.textContent =
                "Não foi possível carregar as manutenções. Verifique se a API está funcionando.";
            mensagemVazia.hidden = false;
        }
    }

    // ==================================================
    // FUNÇÕES AUXILIARES
    // ==================================================

    function escapar(texto) {
        return String(texto ?? "").replace(/[&<>"']/g, caractere => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[caractere]);
    }

    function mostrarNotificacao(texto) {
        notificacao.textContent = texto;
        notificacao.classList.add("visivel");

        clearTimeout(temporizadorNotificacao);

        temporizadorNotificacao = setTimeout(() => {
            notificacao.classList.remove("visivel");
        }, 3500);
    }

    function formatarData(data) {
        if (!data) return "—";

        const partes = String(data).slice(0, 10).split("-");

        if (partes.length !== 3) {
            return escapar(data);
        }

        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    function formatarMoeda(valor) {
        return Number(valor || 0).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });
    }

    function buscarViatura(id) {
        return viaturas.find(
            viatura => Number(viatura.id) === Number(id)
        );
    }

    function atualizarOpcoesViaturas() {
        const select = $("viaturaId");
        const valorAnterior = select.value;

        select.innerHTML =
            '<option value="">Selecione uma viatura</option>';

        viaturas.forEach(viatura => {
            const opcao = document.createElement("option");

            opcao.value = viatura.id;
            opcao.textContent =
                `${viatura.placa} — ${viatura.marca} ${viatura.modelo}`;

            select.appendChild(opcao);
        });

        if (viaturas.some(
            viatura => String(viatura.id) === valorAnterior
        )) {
            select.value = valorAnterior;
        }
    }

    // ==================================================
    // INDICADORES E TABELA
    // ==================================================

    function atualizarIndicadores() {
        $("totalManutencoes").textContent = manutencoes.length;

        $("totalPendentes").textContent =
            manutencoes.filter(
                manutencao => manutencao.status === "Pendente"
            ).length;

        $("totalConcluidas").textContent =
            manutencoes.filter(
                manutencao => manutencao.status === "Concluída"
            ).length;

        const custoTotal = manutencoes.reduce(
            (total, manutencao) =>
                total + Number(manutencao.custo || 0),
            0
        );

        $("custoTotal").textContent = formatarMoeda(custoTotal);
    }

    function renderizar() {
        const pesquisa = $("pesquisa").value
            .trim()
            .toLocaleLowerCase("pt-BR");

        const filtroTipo = $("filtroTipo").value;
        const filtroStatus = $("filtroStatus").value;

        const filtradas = manutencoes
            .filter(manutencao => {
                const viatura = buscarViatura(manutencao.viaturaId);

                const texto = [
                    viatura?.placa || "Viatura não encontrada",
                    viatura?.marca || "",
                    viatura?.modelo || "",
                    manutencao.descricao,
                    manutencao.responsavel
                ].join(" ").toLocaleLowerCase("pt-BR");

                return texto.includes(pesquisa) &&
                    (!filtroTipo || manutencao.tipo === filtroTipo) &&
                    (!filtroStatus ||
                        manutencao.status === filtroStatus);
            })
            .sort((a, b) =>
                b.dataManutencao.localeCompare(a.dataManutencao)
            );

        lista.innerHTML = filtradas.map(manutencao => {
            const viatura = buscarViatura(manutencao.viaturaId);

            const placa = viatura
                ? viatura.placa
                : "Viatura não encontrada";

            const classeTipo = manutencao.tipo === "Preventiva"
                ? "preventiva"
                : "corretiva";

            const classeStatus = manutencao.status === "Concluída"
                ? "concluida"
                : "pendente";

            const descricao = manutencao.descricao || "";

            return `
                <tr>
                    <td>
                        <span class="placa">${escapar(placa)}</span>
                    </td>

                    <td>
                        <span class="tipo ${classeTipo}">
                            ${escapar(manutencao.tipo)}
                        </span>
                    </td>

                    <td>${formatarData(manutencao.dataManutencao)}</td>

                    <td title="${escapar(descricao)}">
                        ${escapar(
                            descricao.length > 38
                                ? descricao.slice(0, 38) + "..."
                                : descricao
                        )}
                    </td>

                    <td>${formatarMoeda(manutencao.custo)}</td>

                    <td>
                        <span class="status ${classeStatus}">
                            ${escapar(manutencao.status)}
                        </span>
                    </td>

                    <td>
                        <div class="acoes">
                            <button
                                class="botao-acao"
                                type="button"
                                data-acao="editar"
                                data-id="${manutencao.id}"
                                aria-label="Editar manutenção"
                                title="Editar">✎</button>

                            <button
                                class="botao-acao excluir"
                                type="button"
                                data-acao="excluir"
                                data-id="${manutencao.id}"
                                aria-label="Excluir manutenção"
                                title="Excluir">⌫</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join("");

        mensagemVazia.hidden = filtradas.length > 0;

        if (manutencoes.length === 0) {
            mensagemVazia.textContent =
                "Nenhuma manutenção registrada. Clique em “Registrar manutenção” para começar.";
        } else if (filtradas.length === 0) {
            mensagemVazia.textContent =
                "Nenhuma manutenção corresponde aos filtros selecionados.";
        }

        $("quantidadeRegistros").textContent =
            `${filtradas.length} ${
                filtradas.length === 1 ? "registro" : "registros"
            }`;

        atualizarIndicadores();
    }

    // ==================================================
    // ABRIR E FECHAR MODAL
    // ==================================================

    async function abrirModal(manutencao = null) {
        try {
            await carregarViaturas();
        } catch (erro) {
            console.error(erro);
            mostrarNotificacao("Não foi possível carregar as viaturas.");
            return;
        }

        formulario.reset();

        $("manutencaoId").value = "";
        $("mensagemFormulario").textContent = "";

        if (viaturas.length === 0) {
            $("mensagemFormulario").textContent =
                "Cadastre uma viatura antes de registrar uma manutenção.";
        }

        if (manutencao) {
            $("tituloModal").textContent = "Editar manutenção";
            $("salvarManutencao").textContent = "Salvar alterações";

            $("manutencaoId").value = manutencao.id;
            $("viaturaId").value = String(manutencao.viaturaId);
            $("tipo").value = manutencao.tipo;
            $("dataManutencao").value =
                manutencao.dataManutencao;
            $("quilometragem").value =
                manutencao.quilometragem;
            $("custo").value = manutencao.custo;
            $("descricao").value = manutencao.descricao;
            $("responsavel").value = manutencao.responsavel || "";
            $("status").value = manutencao.status || "Pendente";
        } else {
            $("tituloModal").textContent = "Registrar manutenção";
            $("salvarManutencao").textContent = "Salvar manutenção";

            const hoje = new Date();
            hoje.setMinutes(
                hoje.getMinutes() - hoje.getTimezoneOffset()
            );

            $("dataManutencao").value =
                hoje.toISOString().slice(0, 10);

            $("status").value = "Pendente";
            $("tipo").value = "Preventiva";
            $("custo").value = "0";
        }

        modal.classList.add("aberto");
        modal.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
        $("viaturaId").focus();
    }

    function fecharModal() {
        modal.classList.remove("aberto");
        modal.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";

        formulario.reset();
        $("mensagemFormulario").textContent = "";
    }

    $("abrirCadastro").addEventListener("click", () => {
        abrirModal();
    });

    $("fecharModal").addEventListener("click", fecharModal);
    $("cancelarCadastro").addEventListener("click", fecharModal);

    modal.addEventListener("click", evento => {
        if (evento.target === modal) {
            fecharModal();
        }
    });

    document.addEventListener("keydown", evento => {
        if (
            evento.key === "Escape" &&
            modal.classList.contains("aberto")
        ) {
            fecharModal();
        }
    });

    // ==================================================
    // PESQUISA E FILTROS
    // ==================================================

    $("pesquisa").addEventListener("input", renderizar);
    $("filtroTipo").addEventListener("change", renderizar);
    $("filtroStatus").addEventListener("change", renderizar);

    $("limparPesquisa").addEventListener("click", () => {
        $("pesquisa").value = "";
        $("filtroTipo").value = "";
        $("filtroStatus").value = "";

        renderizar();
    });

    // ==================================================
    // CADASTRAR E EDITAR
    // ==================================================

    formulario.addEventListener("submit", async evento => {
        evento.preventDefault();

        const botaoSalvar = $("salvarManutencao");

        $("mensagemFormulario").textContent = "";

        const idAtual = $("manutencaoId").value;
        const viaturaId = Number($("viaturaId").value);
        const quilometragem = Number($("quilometragem").value);
        const custo = Number($("custo").value);
        const dataManutencao = $("dataManutencao").value;
        const descricao = $("descricao").value.trim();

        if (!viaturas.some(
            viatura => Number(viatura.id) === viaturaId
        )) {
            $("mensagemFormulario").textContent =
                "Selecione uma viatura válida.";
            return;
        }

        if (!dataManutencao) {
            $("mensagemFormulario").textContent =
                "Informe a data da manutenção.";
            return;
        }

        if (!Number.isInteger(quilometragem) || quilometragem < 0) {
            $("mensagemFormulario").textContent =
                "Informe uma quilometragem válida.";
            return;
        }

        if (!Number.isFinite(custo) || custo < 0) {
            $("mensagemFormulario").textContent =
                "Informe um custo válido.";
            return;
        }

        if (!descricao) {
            $("mensagemFormulario").textContent =
                "Informe a descrição do serviço.";
            return;
        }

        const manutencao = {
            viaturaId: viaturaId,
            tipo: $("tipo").value,
            dataManutencao: `${dataManutencao}T00:00:00`,
            quilometragem: quilometragem,
            descricao: descricao,
            custo: custo,
            responsavel: $("responsavel").value.trim() || null,
            status: $("status").value
        };

        botaoSalvar.disabled = true;
        botaoSalvar.textContent = "Salvando...";

        try {
            if (idAtual) {
                await requisicaoAPI(
                    `${API_MANUTENCOES}/${Number(idAtual)}`,
                    {
                        method: "PUT",
                        body: JSON.stringify(manutencao)
                    }
                );
            } else {
                await requisicaoAPI(API_MANUTENCOES, {
                    method: "POST",
                    body: JSON.stringify(manutencao)
                });
            }

            await carregarManutencoes();
            await carregarViaturas();

            fecharModal();

            mostrarNotificacao(
                idAtual
                    ? "Manutenção atualizada com sucesso!"
                    : "Manutenção registrada com sucesso!"
            );
        } catch (erro) {
            console.error("Erro ao salvar manutenção:", erro);

            $("mensagemFormulario").textContent =
                erro.message ||
                "Não foi possível salvar. Confira a conexão com a API.";
        } finally {
            botaoSalvar.disabled = false;
            botaoSalvar.textContent = idAtual
                ? "Salvar alterações"
                : "Salvar manutenção";
        }
    });

    // ==================================================
    // EDITAR E EXCLUIR
    // ==================================================

    lista.addEventListener("click", async evento => {
        const botao = evento.target.closest("button[data-acao]");

        if (!botao) return;

        const id = Number(botao.dataset.id);

        const manutencao = manutencoes.find(
            item => Number(item.id) === id
        );

        if (!manutencao) return;

        if (botao.dataset.acao === "editar") {
            abrirModal(manutencao);
            return;
        }

        if (botao.dataset.acao === "excluir") {
            const confirmar = window.confirm(
                "Deseja realmente excluir este registro de manutenção?"
            );

            if (!confirmar) return;

            botao.disabled = true;

            try {
                await requisicaoAPI(
                    `${API_MANUTENCOES}/${id}`,
                    { method: "DELETE" }
                );

                await carregarManutencoes();

                mostrarNotificacao(
                    "Manutenção excluída com sucesso!"
                );
            } catch (erro) {
                console.error("Erro ao excluir manutenção:", erro);

                mostrarNotificacao(
                    erro.message ||
                    "Não foi possível excluir a manutenção."
                );

                botao.disabled = false;
            }
        }
    });

    // Atualiza os dados ao voltar para esta página.
    window.addEventListener("focus", carregarDados);

    // Carrega os registros ao abrir a página.
    carregarDados();
});
