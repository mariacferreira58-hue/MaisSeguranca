
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MaisSeguranca.Data;

namespace MaisSeguranca.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PreventivasController : ControllerBase
    {
        private readonly MaisSegurancaContext _context;

        public PreventivasController(MaisSegurancaContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> Listar()
        {
            var preventivas = await _context.Preventivas
                .AsNoTracking()
                .OrderBy(p => p.DataPrevista)
                .ToListAsync();

            return Ok(preventivas);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> Buscar(int id)
        {
            var preventiva = await _context.Preventivas
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == id);

            if (preventiva == null)
                return NotFound(new { mensagem = "Preventiva não encontrada." });

            return Ok(preventiva);
        }

        [HttpPost]
        public async Task<IActionResult> Cadastrar(
            [FromBody] Preventiva preventiva)
        {
            var viaturaExiste = await _context.Viaturas
                .AnyAsync(v => v.Id == preventiva.ViaturaId);

            if (!viaturaExiste)
                return BadRequest(new
                {
                    mensagem = "A viatura informada não existe."
                });

            if (preventiva.DataPrevista == default)
                return BadRequest(new
                {
                    mensagem = "Informe a data prevista."
                });

            if (preventiva.QuilometragemPrevista < 0)
                return BadRequest(new
                {
                    mensagem = "A quilometragem não pode ser negativa."
                });

            preventiva.Status = string.IsNullOrWhiteSpace(preventiva.Status)
                ? "Agendada"
                : preventiva.Status;

            preventiva.Concluida =
                preventiva.Status == "Concluída";

            _context.Preventivas.Add(preventiva);
            await _context.SaveChangesAsync();

            return Ok(preventiva);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Editar(
            int id,
            [FromBody] Preventiva dados)
        {
            var preventiva = await _context.Preventivas.FindAsync(id);

            if (preventiva == null)
                return NotFound(new
                {
                    mensagem = "Preventiva não encontrada."
                });

            var viaturaExiste = await _context.Viaturas
                .AnyAsync(v => v.Id == dados.ViaturaId);

            if (!viaturaExiste)
                return BadRequest(new
                {
                    mensagem = "A viatura informada não existe."
                });

            if (dados.DataPrevista == default ||
                dados.QuilometragemPrevista < 0)
                return BadRequest(new
                {
                    mensagem = "Confira a data e a quilometragem."
                });

            preventiva.ViaturaId = dados.ViaturaId;
            preventiva.Descricao = dados.Descricao;
            preventiva.DataPrevista = dados.DataPrevista;
            preventiva.QuilometragemPrevista = dados.QuilometragemPrevista;
            preventiva.Status = string.IsNullOrWhiteSpace(dados.Status)
                ? "Agendada"
                : dados.Status;
            preventiva.Observacoes = dados.Observacoes;
            preventiva.Concluida = preventiva.Status == "Concluída";

            await _context.SaveChangesAsync();

            return Ok(preventiva);
        }

        [HttpPut("{id}/concluir")]
        public async Task<IActionResult> Concluir(int id)
        {
            var preventiva = await _context.Preventivas.FindAsync(id);

            if (preventiva == null)
                return NotFound();

            preventiva.Concluida = true;
            preventiva.Status = "Concluída";

            await _context.SaveChangesAsync();

            return Ok(preventiva);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Excluir(int id)
        {
            var preventiva = await _context.Preventivas.FindAsync(id);

            if (preventiva == null)
                return NotFound();

            _context.Preventivas.Remove(preventiva);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
