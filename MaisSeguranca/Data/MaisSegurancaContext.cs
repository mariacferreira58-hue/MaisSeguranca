using Microsoft.EntityFrameworkCore;
namespace MaisSeguranca.Data
{
    public class MaisSegurancaContext : DbContext
    {
        public MaisSegurancaContext(
            DbContextOptions<MaisSegurancaContext> options)
            : base(options)
        {
        }

        public DbSet<Viatura> Viaturas { get; set; }

        public DbSet<Manutencao> Manutencoes { get; set; }

        public DbSet<Preventiva> Preventivas { get; set; }

        public DbSet<Usuario> Usuarios { get; set; }

    }
}

