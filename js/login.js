document.addEventListener("DOMContentLoaded", () => {

    // ENDEREÇO DA API
    // Confira a porta no endereço do Swagger do seu backend.
    const API_URL = "https://localhost:7037/api/Usuarios/login";

    const formulario = document.querySelector(".form-login");
    const campoEmail = document.querySelector(
        'input[type="email"]'
    );
    const campoSenha = document.querySelector(
        'input[type="password"]'
    );
    const botaoEntrar = document.querySelector(".botao-entrar");
    const campoLembrar = document.querySelector(
        'input[type="checkbox"]'
    );

    if (!formulario || !campoEmail || !campoSenha || !botaoEntrar) {
        console.error("Não foi possível localizar os campos do login.");
        return;
    }

    // ÁREA DE MENSAGENS
    let mensagem = document.querySelector(".mensagem");

    if (!mensagem) {
        mensagem = document.createElement("p");
        mensagem.className = "mensagem";
        mensagem.setAttribute("role", "status");
        formulario.appendChild(mensagem);
    }

    function mostrarMensagem(texto, erro = false) {
        mensagem.textContent = texto;
        mensagem.style.color = erro ? "#c62828" : "#176b3a";
    }

    // PREENCHER O E-MAIL SALVO
    const emailSalvo = localStorage.getItem("emailLogin");

    if (emailSalvo) {
        campoEmail.value = emailSalvo;

        if (campoLembrar) {
            campoLembrar.checked = true;
        }
    }

    // MOSTRAR OU OCULTAR A SENHA
    const botaoMostrarSenha = document.querySelector(
        ".campo-senha button"
    );

    if (botaoMostrarSenha) {
        botaoMostrarSenha.addEventListener("click", () => {
            const senhaVisivel = campoSenha.type === "text";

            campoSenha.type = senhaVisivel ? "password" : "text";
            botaoMostrarSenha.setAttribute(
                "aria-label",
                senhaVisivel ? "Mostrar senha" : "Ocultar senha"
            );
        });
    }

    // ESQUECI MINHA SENHA
    document.querySelectorAll(".link-ajuda").forEach(botao => {
        botao.addEventListener("click", () => {
            mostrarMensagem(
                "Entre em contato com o administrador para redefinir sua senha."
            );
        });
    });

    // LOGIN
    formulario.addEventListener("submit", async (evento) => {
        evento.preventDefault();

        const email = campoEmail.value.trim();
        const senha = campoSenha.value;

        if (!email || !senha) {
            mostrarMensagem(
                "Preencha o e-mail e a senha.",
                true
            );
            return;
        }

        botaoEntrar.disabled = true;
        botaoEntrar.textContent = "Entrando...";
        mostrarMensagem("Verificando seus dados...");

        try {
            const resposta = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: email,
                    senha: senha
                })
            });

            const dados = await resposta.json().catch(() => ({}));

            if (!resposta.ok) {
                throw new Error(
                    dados.mensagem ||
                    dados.message ||
                    "E-mail ou senha inválidos."
                );
            }

            // Salvar o e-mail somente se "Lembrar-me" estiver marcado.
            if (campoLembrar && campoLembrar.checked) {
                localStorage.setItem("emailLogin", email);
            } else {
                localStorage.removeItem("emailLogin");
            }

            mostrarMensagem("Login realizado com sucesso!");

            // Se a API devolver um token, guardá-lo para futuras requisições.
            if (dados.token) {
                sessionStorage.setItem("token", dados.token);
            }

            // Guardar o identificador, se a API o devolver.
            if (dados.id !== undefined) {
                sessionStorage.setItem("usuarioId", dados.id);
            } else if (dados.usuario && dados.usuario.id !== undefined) {
                sessionStorage.setItem("usuarioId", dados.usuario.id);
            }

            // Ir para a página inicial.
            setTimeout(() => {
                window.location.href = "dashboard.html";
            }, 500);

        } catch (erro) {
            console.error("Erro no login:", erro);

            if (erro instanceof TypeError) {
                mostrarMensagem(
                    "Não foi possível conectar à API. Confira se o backend está iniciado e se o endereço está correto.",
                    true
                );
            } else {
                mostrarMensagem(erro.message, true);
            }

        } finally {
            botaoEntrar.disabled = false;
            botaoEntrar.textContent = "Entrar";
        }
    });

});