
document.addEventListener("DOMContentLoaded", () => {
    const $ = (id) => document.getElementById(id);

    // API do projeto MaisSeguranca
    const API_URL = "https://localhost:7037/api/Viaturas";

    const formulario = $("formViatura");
    const modal = $("modalViatura");
    const lista = $("listaViaturas");
    const mensagemVazia = $("mensagemVazia");
    const notificacao = $("notificacao");

    let viaturas = [];
    let temporizadorNotificacao;
    let salvando = false;

    // ==========================================
    // COMUNICAÇÃO COM A API
    // ==========================================

    async function requisicaoAPI(url, opcoes = {}) {
        let resposta;

        try {
            resposta = await fetch(url, {
                ...opcoes,
                headers: {
                    "Content-Type": "application/json",
                    ...opcoes.headers
                }
            });
        } catch (erro) {
            throw new Error(
                "Não foi possível conectar à API. " +
                "Confira se o backend está iniciado e se o endereço está correto."
            );
        }

        const texto = await resposta.text();
        let dados = null;

        if (texto) {
            try {
                dados = JSON.parse(texto);
            } catch {
                dados = texto;
            }
        }

        if (!resposta.ok) {
            const mensagem =
                dados?.mensagem ||
                dados?.title ||
                (typeof dados === "string" ? dados : null) ||
                `Erro na API: ${resposta.status}`;

            throw new Error(mensagem);
        }

        return dados;
    }

    async function carregarViaturas() {
        mensagemVazia.textContent = "Carregando viaturas...";
        mensagemVazia.hidden = false;

        try {
            const dados = await requisicaoAPI(API_URL);

            viaturas = Array.isArray(dados) ? dados : [];

            renderizar();
        } catch (erro) {
            console.error("Erro ao carregar viaturas:", erro);

            viaturas = [];
            renderizar();

            mensagemVazia.textContent =
                "Não foi possível carregar as viaturas. " +
                "Verifique se o backend está iniciado.";

            mensagemVazia.hidden = false;

            mostrarNotificacao(erro.message);
        }
    }

    // ==========================================
    // NOTIFICAÇÕES E FORMATAÇÃO
    // ==========================================

    function mostrarNotificacao(texto) {
        notificacao.textContent = texto;
        notificacao.classList.add("visivel");

        clearTimeout(temporizadorNotificacao);

        temporizadorNotificacao = setTimeout(() => {
            notificacao.classList.remove("visivel");
        }, 4000);
    }

    function escapar(texto) {
        return String(texto ?? "").replace(/[&<>"']/g, caractere => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[caractere]);
    }

    function classeStatus(status) {
        if (status === "Disponível") return "disponivel";
        if (status === "Em manutenção") return "manutencao";
        return "inativa";
    }

    // ==========================================
    // INDICADORES
    // ==========================================

    function atualizarIndicadores() {
        $("totalViaturas").textContent = viaturas.length;

        $("totalDisponiveis").textContent =
            viaturas.filter(v => v.status === "Disponível").length;

        $("totalManutencao").textContent =
            viaturas.filter(v => v.status === "Em manutenção").length;

        $("totalInativas").textContent =
            viaturas.filter(v => v.status === "Inativa").length;
    }

    // ==========================================
    // LISTAGEM, PESQUISA E FILTROS
    // ==========================================

    function renderizar() {
        const pesquisa = $("pesquisa").value
            .trim()
            .toLocaleLowerCase("pt-BR");

        const filtro = $("filtroStatus").value;

        const filtradas = viaturas.filter(viatura => {
            const texto = [
                viatura.placa,
                viatura.marca,
                viatura.modelo,
                viatura.ano
            ].join(" ").toLocaleLowerCase("pt-BR");

            return texto.includes(pesquisa) &&
                (!filtro || viatura.status === filtro);
        });

        lista.innerHTML = filtradas.map(viatura => `
            <tr>
                <td>
                    <span class="placa">${escapar(viatura.placa)}</span>
                </td>

                <td>
                    <div class="modelo-celula">
                        <strong>${escapar(viatura.marca)}</strong>
                        <small>${escapar(viatura.modelo)}</small>
                    </div>
                </td>

                <td>${escapar(viatura.ano)}</td>

                <td>
                    ${Number(viatura.quilometragem).toLocaleString("pt-BR")} km
                </td>

                <td>
                    <span class="status ${classeStatus(viatura.status)}">
                        ${escapar(viatura.status)}
                    </span>
                </td>

                <td>
                    <div class="acoes">
                        <button
                            class="botao-acao"
                            type="button"
                            data-acao="editar"
                            data-id="${viatura.id}"
                            aria-label="Editar ${escapar(viatura.placa)}"
                            title="Editar">✎</button>

                        <button
                            class="botao-acao excluir"
                            type="button"
                            data-acao="excluir"
                            data-id="${viatura.id}"
                            aria-label="Excluir ${escapar(viatura.placa)}"
                            title="Excluir">⌫</button>
                    </div>
                </td>
            </tr>
        `).join("");

        if (viaturas.length === 0) {
            mensagemVazia.textContent =
                "Nenhuma viatura cadastrada. Clique em “Cadastrar viatura” para começar.";

            mensagemVazia.hidden = false;
        } else if (filtradas.length === 0) {
            mensagemVazia.textContent =
                "Nenhuma viatura corresponde à pesquisa ou ao filtro selecionado.";

            mensagemVazia.hidden = false;
        } else {
            mensagemVazia.hidden = true;
        }

        $("quantidadeRegistros").textContent =
            `${filtradas.length} ${
                filtradas.length === 1 ? "viatura" : "viaturas"
            }`;

        atualizarIndicadores();
    }

    // ==========================================
    // ABRIR E FECHAR O FORMULÁRIO
    // ==========================================

    function abrirModal(viatura = null) {
        formulario.reset();

        $("viaturaId").value = "";
        $("mensagemFormulario").textContent = "";

        if (viatura) {
            $("tituloModal").textContent = "Editar viatura";
            $("salvarViatura").textContent = "Salvar alterações";

            $("viaturaId").value = viatura.id;
            $("placa").value = viatura.placa;
            $("marca").value = viatura.marca;
            $("modelo").value = viatura.modelo;
            $("ano").value = viatura.ano;
            $("quilometragem").value = viatura.quilometragem;
            $("status").value = viatura.status;
        } else {
            $("tituloModal").textContent = "Cadastrar viatura";
            $("salvarViatura").textContent = "Salvar viatura";
            $("status").value = "Disponível";
        }

        modal.classList.add("aberto");
        modal.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";

        $("placa").focus();
    }

    function fecharModal() {
        modal.classList.remove("aberto");
        modal.setAttribute("aria-hidden", "true");

        document.body.style.overflow = "";

        formulario.reset();
        $("mensagemFormulario").textContent = "";
    }

    $("abrirCadastro").addEventListener("click", () => abrirModal());
    $("fecharModal").addEventListener("click", fecharModal);
    $("cancelarCadastro").addEventListener("click", fecharModal);

    modal.addEventListener("click", evento => {
        if (evento.target === modal && !salvando) {
            fecharModal();
        }
    });

    document.addEventListener("keydown", evento => {
        if (
            evento.key === "Escape" &&
            modal.classList.contains("aberto") &&
            !salvando
        ) {
            fecharModal();
        }
    });

    $("pesquisa").addEventListener("input", renderizar);
    $("filtroStatus").addEventListener("change", renderizar);

    $("limparPesquisa").addEventListener("click", () => {
        $("pesquisa").value = "";
        $("filtroStatus").value = "";
        renderizar();
    });

    $("placa").addEventListener("input", evento => {
        evento.target.value = evento.target.value.toUpperCase();
    });

    // ==========================================
    // CADASTRAR E ATUALIZAR NO SQL SERVER
    // ==========================================

    formulario.addEventListener("submit", async evento => {
        evento.preventDefault();

        if (salvando) return;

        const mensagem = $("mensagemFormulario");
        const botaoSalvar = $("salvarViatura");

        const idAtual = $("viaturaId").value;

        const viatura = {
            placa: $("placa").value.trim().toUpperCase(),
            marca: $("marca").value.trim(),
            modelo: $("modelo").value.trim(),
            ano: Number($("ano").value),
            quilometragem: Number($("quilometragem").value),
            status: $("status").value
        };

        if (!viatura.placa || !viatura.marca || !viatura.modelo) {
            mensagem.textContent =
                "Preencha todos os campos obrigatórios.";
            return;
        }

        if (
            !Number.isInteger(viatura.ano) ||
            viatura.ano < 1900 ||
            viatura.ano > 2100
        ) {
            mensagem.textContent = "Informe um ano válido.";
            return;
        }

        if (
            !Number.isInteger(viatura.quilometragem) ||
            viatura.quilometragem < 0
        ) {
            mensagem.textContent = "Informe uma quilometragem válida.";
            return;
        }

        const placaDuplicada = viaturas.some(v =>
            v.placa.toUpperCase() === viatura.placa &&
            Number(v.id) !== Number(idAtual || 0)
        );

        if (placaDuplicada) {
            mensagem.textContent =
                "Já existe uma viatura cadastrada com essa placa.";
            return;
        }

        salvando = true;
        botaoSalvar.disabled = true;
        botaoSalvar.textContent = "Salvando...";

        try {
            if (idAtual) {
                await requisicaoAPI('${API_URL}/${idAtual}', {
                    method: "PUT",
                    body: JSON.stringify(viatura)
                });

                mostrarNotificacao(
                    "Viatura atualizada e salva no banco de dados!"
                );
            } else {
                await requisicaoAPI(API_URL, {
                    method: "POST",
                    body: JSON.stringify(viatura)
                });

                mostrarNotificacao(
                    "Viatura cadastrada e salva no banco de dados!"
                );
            }

            fecharModal();

            // Busca novamente os dados verdadeiros da API.
            await carregarViaturas();

        } catch (erro) {
            console.error("Erro ao salvar viatura:", erro);

            mensagem.textContent = erro.message;
        } finally {
            salvando = false;
            botaoSalvar.disabled = false;

            botaoSalvar.textContent = idAtual
                ? "Salvar alterações"
                : "Salvar viatura";
        }
    });

    // ==========================================
    // EDITAR E EXCLUIR
    // ==========================================

    lista.addEventListener("click", async evento => {
        const botao = evento.target.closest("button[data-acao]");

        if (!botao) return;

        const id = Number(botao.dataset.id);

        const viatura = viaturas.find(v => Number(v.id) === id);

        if (!viatura) return;

        if (botao.dataset.acao === "editar") {
            abrirModal(viatura);
            return;
        }

        if (botao.dataset.acao === "excluir") {
            const confirmar = window.confirm(
                'Deseja realmente excluir a viatura ${viatura.placa}?'
            );

            if (!confirmar) return;

            botao.disabled = true;

            try {
                await requisicaoAPI('${API_URL}/${id}', {
                    method: "DELETE"
                });

                mostrarNotificacao(
                    "Viatura excluída do banco de dados!"
                );

                await carregarViaturas();

            } catch (erro) {
                console.error("Erro ao excluir viatura:", erro);
                mostrarNotificacao(erro.message);
                botao.disabled = false;
            }
        }
    });

    // ==========================================
    // INICIALIZAÇÃO
    // ==========================================

    carregarViaturas();
});
