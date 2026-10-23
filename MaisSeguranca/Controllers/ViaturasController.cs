using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MaisSeguranca.Data;

namespace MaisSeguranca.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ViaturasController : ControllerBase
    {
        private readonly MaisSegurancaContext _context;

        public ViaturasController(MaisSegurancaContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> Listar()
        {
            var viaturas = await _context.Viaturas
                .AsNoTracking()
                .ToListAsync();

            return Ok(viaturas);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> Buscar(int id)
        {
            var viatura = await _context.Viaturas.FindAsync(id);

            if (viatura == null)
                return NotFound(new { mensagem = "Viatura não encontrada." });

            return Ok(viatura);
        }

        [HttpPost]
        public async Task<IActionResult> Cadastrar(Viatura viatura)
        {
            var placa = viatura.Placa.Trim().ToUpperInvariant();

            var existe = await _context.Viaturas
                .AnyAsync(v => v.Placa == placa);

            if (existe)
                return BadRequest(new { mensagem = "Esta placa já está cadastrada." });

            viatura.Placa = placa;
            viatura.DataCadastro = DateTime.Now;

            _context.Viaturas.Add(viatura);
            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(Buscar),
                new { id = viatura.Id },
                viatura
            );
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Atualizar(int id, Viatura dados)
        {
            var viatura = await _context.Viaturas.FindAsync(id);

            if (viatura == null)
                return NotFound(new { mensagem = "Viatura não encontrada." });

            var placa = dados.Placa.Trim().ToUpperInvariant();

            var placaExiste = await _context.Viaturas
                .AnyAsync(v => v.Placa == placa && v.Id != id);

            if (placaExiste)
                return BadRequest(new { mensagem = "Esta placa já está cadastrada." });

            viatura.Placa = placa;
            viatura.Marca = dados.Marca;
            viatura.Modelo = dados.Modelo;
            viatura.Ano = dados.Ano;
            viatura.Quilometragem = dados.Quilometragem;
            viatura.Status = dados.Status;

            await _context.SaveChangesAsync();

            return Ok(viatura);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Excluir(int id)
        {
            var viatura = await _context.Viaturas.FindAsync(id);

            if (viatura == null)
                return NotFound(new { mensagem = "Viatura não encontrada." });

            var possuiManutencoes = await _context.Manutencoes
                .AnyAsync(m => m.ViaturaId == id);

            var possuiPreventivas = await _context.Preventivas
                .AnyAsync(p => p.ViaturaId == id);

            if (possuiManutencoes || possuiPreventivas)
            {
                return BadRequest(new
                {
                    mensagem = "Não é possível excluir uma viatura com histórico. Preserve os registros."
                });
            }

            _context.Viaturas.Remove(viatura);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}