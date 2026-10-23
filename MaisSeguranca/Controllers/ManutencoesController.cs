
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MaisSeguranca.Data;

namespace MaisSeguranca.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ManutencoesController : ControllerBase
    {
        private readonly MaisSegurancaContext _context;

        public ManutencoesController(MaisSegurancaContext context)
        {
            _context = context;
        }

        // LISTAR MANUTENÇÕES
        [HttpGet]
        public async Task<IActionResult> Listar()
        {
            var manutencoes = await _context.Manutencoes
                .AsNoTracking()
                .OrderByDescending(m => m.DataManutencao)
                .ToListAsync();

            return Ok(manutencoes);
        }

        // BUSCAR MANUTENÇÃO POR ID
        [HttpGet("{id}")]
        public async Task<IActionResult> Buscar(int id)
        {
            var manutencao = await _context.Manutencoes
                .AsNoTracking()
                .FirstOrDefaultAsync(m => m.Id == id);

            if (manutencao == null)
                return NotFound(new
                {
                    mensagem = "Manutenção não encontrada."
                });

            return Ok(manutencao);
        }

        // CADASTRAR MANUTENÇÃO
        [HttpPost]
        public async Task<IActionResult> Cadastrar(
            [FromBody] Manutencao manutencao)
        {
            var viatura = await _context.Viaturas
                .FindAsync(manutencao.ViaturaId);

            if (viatura == null)
                return BadRequest(new
                {
                    mensagem = "A viatura informada não existe."
                });

            if (manutencao.Quilometragem < 0 || manutencao.Custo < 0)
                return BadRequest(new
                {
                    mensagem = "Quilometragem e custo não podem ser negativos."
                });

            manutencao.Status = string.IsNullOrWhiteSpace(manutencao.Status)
                ? "Pendente"
                : manutencao.Status;

            _context.Manutencoes.Add(manutencao);

            if (manutencao.Quilometragem > viatura.Quilometragem)
                viatura.Quilometragem = manutencao.Quilometragem;

            await _context.SaveChangesAsync();

            return Ok(manutencao);
        }

        // EDITAR MANUTENÇÃO
        [HttpPut("{id}")]
        public async Task<IActionResult> Editar(
            int id,
            [FromBody] Manutencao dados)
        {
            var manutencao = await _context.Manutencoes.FindAsync(id);

            if (manutencao == null)
                return NotFound(new
                {
                    mensagem = "Manutenção não encontrada."
                });

            var viatura = await _context.Viaturas
                .FindAsync(dados.ViaturaId);

            if (viatura == null)
                return BadRequest(new
                {
                    mensagem = "A viatura informada não existe."
                });

            if (dados.Quilometragem < 0 || dados.Custo < 0)
                return BadRequest(new
                {
                    mensagem = "Quilometragem e custo não podem ser negativos."
                });

            manutencao.ViaturaId = dados.ViaturaId;
            manutencao.Tipo = dados.Tipo;
            manutencao.DataManutencao = dados.DataManutencao;
            manutencao.Quilometragem = dados.Quilometragem;
            manutencao.Descricao = dados.Descricao;
            manutencao.Custo = dados.Custo;
            manutencao.Responsavel = dados.Responsavel;
            manutencao.Status = dados.Status;

            if (dados.Quilometragem > viatura.Quilometragem)
                viatura.Quilometragem = dados.Quilometragem;

            await _context.SaveChangesAsync();

            return Ok(manutencao);
        }

        // EXCLUIR MANUTENÇÃO
        [HttpDelete("{id}")]
        public async Task<IActionResult> Excluir(int id)
        {
            var manutencao = await _context.Manutencoes.FindAsync(id);

            if (manutencao == null)
                return NotFound(new
                {
                    mensagem = "Manutenção não encontrada."
                });

            _context.Manutencoes.Remove(manutencao);

            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
