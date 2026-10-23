namespace MaisSeguranca.Data
{
    public class Manutencao
    {
        public int Id { get; set; }

        public int ViaturaId { get; set; }

        public string Tipo { get; set; } = string.Empty;

        public DateTime DataManutencao { get; set; }

        public int Quilometragem { get; set; }

        public string Descricao { get; set; } = string.Empty;

        public decimal Custo { get; set; }

        public string? Responsavel { get; set; }

        public string Status { get; set; } = "Pendente";
    }
}