
namespace MaisSeguranca.Data
{
    public class Preventiva
    {
        public int Id { get; set; }

        public int ViaturaId { get; set; }

        public string Descricao { get; set; } = string.Empty;

        public DateTime DataPrevista { get; set; }

        public int? QuilometragemPrevista { get; set; }

        public bool Concluida { get; set; }

        public string Status { get; set; } = "Agendada";

        public string? Observacoes { get; set; }
    }
}
