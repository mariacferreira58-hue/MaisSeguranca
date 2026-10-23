
document.addEventListener("DOMContentLoaded", async () => {
    const API_VIATURAS = "https://localhost:7037/api/Viaturas";
    const API_MANUTENCOES = "https://localhost:7037/api/Manutencoes";
    const API_PREVENTIVAS = "https://localhost:7037/api/Preventivas";

    const elementoData = document.getElementById("dataAtual");

    if (elementoData) {
        elementoData.textContent = new Date().toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric"
        });
    }

    const botaoSair = document.getElementById("botaoSair");

    if (botaoSair) {
        botaoSair.addEventListener("click", () => {
            if (confirm("Deseja realmente sair do sistema?")) {
                window.location.href = "login.html";
            }
        });
    }

    function atualizarIndicador(id, valor) {
        const elemento = document.getElementById(id);

        if (elemento) {
            elemento.textContent = valor;
        }
    }

    async function buscarDados(url) {
        const resposta = await fetch(url);

        if (!resposta.ok) {
            throw new Error(`Erro ao consultar a API: ${resposta.status}`);
        }

        const dados = await resposta.json();

        if (!Array.isArray(dados)) {
            throw new Error("A API não retornou uma lista válida.");
        }

        return dados;
    }

    function normalizar(texto) {
        return String(texto || "")
            .trim()
            .toLocaleLowerCase("pt-BR")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
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

    function converterData(data) {
        if (!data) return null;

        const partes = String(data).substring(0, 10).split("-");

        if (partes.length !== 3) return null;

        const resultado = new Date(
            Number(partes[0]),
            Number(partes[1]) - 1,
            Number(partes[2])
        );

        return Number.isNaN(resultado.getTime()) ? null : resultado;
    }

    function formatarData(data) {
        const dataConvertida = converterData(data);

        return dataConvertida
            ? dataConvertida.toLocaleDateString("pt-BR")
            : "Data não informada";
    }

    function encontrarViatura(viaturas, id) {
        return viaturas.find(v => Number(v.id) === Number(id));
    }

    function nomeViatura(viaturas, id) {
        const viatura = encontrarViatura(viaturas, id);

        if (!viatura) {
            return `Viatura #${id}`;
        }

        return `${viatura.placa} - ${viatura.marca} ${viatura.modelo}`;
    }

    function mostrarPreventivas(preventivas, viaturas) {
        const lista = document.getElementById("listaPreventivas");

        if (!lista) return;

        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        const proximas = preventivas
            .filter(item => {
                if (item.concluida === true) return false;

                const data = converterData(item.dataPrevista);

                return data && data >= hoje;
            })
            .sort((a, b) => {
                return String(a.dataPrevista).localeCompare(
                    String(b.dataPrevista)
                );
            })
            .slice(0, 5);

        if (proximas.length === 0) {
            lista.innerHTML = `
                <div class="estado-vazio">
                    <span>◷</span>
                    <p>Nenhuma preventiva futura cadastrada.</p>
                </div>
            `;
            return;
        }

        lista.innerHTML = proximas.map(item => {
            const data = converterData(item.dataPrevista);
            const atrasada = data && data < hoje;

            return `
                <div style="
                    display:flex;
                    align-items:center;
                    gap:12px;
                    padding:14px 0;
                    border-bottom:1px solid #e5eaf1;
                ">
                    <div style="
                        min-width:44px;
                        height:44px;
                        border-radius:10px;
                        background:#e8f1ff;
                        color:#1455a0;
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        font-size:21px;
                    ">🔧</div>

                    <div style="flex:1; min-width:0;">
                        <strong style="
                            display:block;
                            color:#17365d;
                            font-size:14px;
                            margin-bottom:5px;
                        ">
                            ${escaparHTML(item.descricao || "Manutenção preventiva")}
                        </strong>

                        <span style="
                            display:block;
                            color:#64748b;
                            font-size:12px;
                            margin-bottom:4px;
                        ">
                            ${escaparHTML(nomeViatura(viaturas, item.viaturaId))}
                        </span>

                        <span style="color:#64748b;font-size:12px;">
                            Data prevista: ${formatarData(item.dataPrevista)}
                        </span>
                    </div>

                    <span style="
                        font-size:11px;
                        font-weight:600;
                        color:${atrasada ? "#b42318" : "#176b42"};
                        background:${atrasada ? "#fee4e2" : "#dcfce7"};
                        padding:6px 8px;
                        border-radius:20px;
                        white-space:nowrap;
                    ">
                        ${atrasada ? "Atrasada" : "Agendada"}
                    </span>
                </div>
            `;
        }).join("");
    }

    async function carregarIndicadores() {
        try {
            const [viaturas, manutencoes, preventivas] =
                await Promise.all([
                    buscarDados(API_VIATURAS),
                    buscarDados(API_MANUTENCOES),
                    buscarDados(API_PREVENTIVAS)
                ]);

            const totalViaturas = viaturas.length;

            const viaturasDisponiveis = viaturas.filter(viatura =>
                normalizar(viatura.status) === "disponivel"
            ).length;

            const viaturasManutencao = viaturas.filter(viatura =>
                normalizar(viatura.status).includes("manutencao")
            ).length;

            const manutencoesPendentes = manutencoes.filter(manutencao =>
                normalizar(manutencao.status) === "pendente"
            ).length;

            const preventivasConcluidas = preventivas.filter(item =>
                item.concluida === true
            ).length;

            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);

            const limite = new Date(hoje);
            limite.setDate(limite.getDate() + 30);

            const preventivasAtrasadas = preventivas.filter(item => {
                if (item.concluida === true) return false;

                const data = converterData(item.dataPrevista);

                return data && data < hoje;
            }).length;

            const preventivasProximas = preventivas.filter(item => {
                if (item.concluida === true) return false;

                const data = converterData(item.dataPrevista);

                return data && data >= hoje && data <= limite;
            }).length;

            atualizarIndicador("totalViaturas", totalViaturas);
            atualizarIndicador("viaturasDisponiveis", viaturasDisponiveis);
            atualizarIndicador("viaturasManutencao", viaturasManutencao);
            atualizarIndicador("manutencoesPendentes", manutencoesPendentes);

            atualizarIndicador("totalPreventivas", preventivas.length);
            atualizarIndicador("proximasPreventivas", preventivasProximas);
            atualizarIndicador("atrasadasPreventivas", preventivasAtrasadas);
            atualizarIndicador("concluidasPreventivas", preventivasConcluidas);

            mostrarPreventivas(preventivas, viaturas);

            console.log("Dashboard atualizado com sucesso.", {
                totalViaturas,
                viaturasDisponiveis,
                viaturasManutencao,
                manutencoesPendentes,
                totalPreventivas: preventivas.length,
                preventivasProximas,
                preventivasAtrasadas,
                preventivasConcluidas
            });
        } catch (erro) {
            console.error("Erro ao carregar Dashboard:", erro);

            atualizarIndicador("totalViaturas", "—");
            atualizarIndicador("viaturasDisponiveis", "—");
            atualizarIndicador("viaturasManutencao", "—");
            atualizarIndicador("manutencoesPendentes", "—");

            const lista = document.getElementById("listaPreventivas");

            if (lista) {
                lista.innerHTML = `
                    <div class="estado-vazio">
                        <span>!</span>
                        <p>Não foi possível carregar as preventivas.</p>
                    </div>
                `;
            }

            alert(
                "Não foi possível carregar os dados do painel. " +
                "Confira se o backend está executando."
            );
        }
    }

    await carregarIndicadores();
});
