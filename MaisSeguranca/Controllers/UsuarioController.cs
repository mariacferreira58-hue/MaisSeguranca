using MaisSeguranca.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MaisSeguranca.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsuariosController : ControllerBase
    {
        private readonly MaisSegurancaContext _context;
        private readonly PasswordHasher<Usuario> _passwordHasher = new();

        public UsuariosController(MaisSegurancaContext context)
        {
            _context = context;
        }

        public class PrimeiroAcessoDto
        {
            public string Nome { get; set; } = string.Empty;
            public string Email { get; set; } = string.Empty;
            public string Senha { get; set; } = string.Empty;
        }

        public class LoginDto
        {
            public string Email { get; set; } = string.Empty;
            public string Senha { get; set; } = string.Empty;
        }

        [HttpPost("configurar-primeiro-acesso")]
        public async Task<IActionResult> ConfigurarPrimeiroAcesso(
            [FromBody] PrimeiroAcessoDto dados)
        {
            if (await _context.Usuarios.AnyAsync())
            {
                return BadRequest(new
                {
                    mensagem = "Já existe um usuário cadastrado. O primeiro acesso já foi configurado."
                });
            }

            if (string.IsNullOrWhiteSpace(dados.Nome) ||
                string.IsNullOrWhiteSpace(dados.Email) ||
                string.IsNullOrWhiteSpace(dados.Senha))
            {
                return BadRequest(new
                {
                    mensagem = "Preencha nome, e-mail e senha."
                });
            }

            if (dados.Senha.Length < 8)
            {
                return BadRequest(new
                {
                    mensagem = "A senha deve ter pelo menos 8 caracteres."
                });
            }

            var usuario = new Usuario
            {
                Nome = dados.Nome.Trim(),
                Email = dados.Email.Trim().ToLowerInvariant(),
                Ativo = true,
                DataCadastro = DateTime.Now
            };

            usuario.SenhaHash = _passwordHasher.HashPassword(
                usuario,
                dados.Senha
            );

            _context.Usuarios.Add(usuario);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                mensagem = "Primeiro usuário criado com sucesso."
            });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dados)
        {
            if (string.IsNullOrWhiteSpace(dados.Email) ||
                string.IsNullOrWhiteSpace(dados.Senha))
            {
                return BadRequest(new
                {
                    mensagem = "Informe o e-mail e a senha."
                });
            }

            var email = dados.Email.Trim().ToLowerInvariant();

            var usuario = await _context.Usuarios
                .FirstOrDefaultAsync(u => u.Email == email);

            if (usuario == null || !usuario.Ativo)
            {
                return Unauthorized(new
                {
                    mensagem = "E-mail ou senha inválidos."
                });
            }

            var resultado = _passwordHasher.VerifyHashedPassword(
                usuario,
                usuario.SenhaHash,
                dados.Senha
            );

            if (resultado == PasswordVerificationResult.Failed)
            {
                return Unauthorized(new
                {
                    mensagem = "E-mail ou senha inválidos."
                });
            }

            return Ok(new
            {
                mensagem = "Login realizado com sucesso.",
                usuario = new
                {
                    usuario.Id,
                    usuario.Nome,
                    usuario.Email
                }
            });
        }
    }
}