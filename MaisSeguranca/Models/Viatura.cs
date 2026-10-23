namespace MaisSeguranca.Data
{
    public class Viatura
    {
        public int Id { get; set; }
        public string Placa { get; set; } = string.Empty;
        public string Marca { get; set; } = string.Empty;
        public string Modelo { get; set; } = string.Empty;
        public int Ano { get; set; }
        public int Quilometragem { get; set; }
        public string Status { get; set; } = "Disponível";
        public DateTime DataCadastro { get; set; }
            = DateTime.Now;
    }
}