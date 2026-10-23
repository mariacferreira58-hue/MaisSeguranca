using MaisSeguranca.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

var conexao = builder.Configuration.GetConnectionString("ConexaoSQL");

if (string.IsNullOrWhiteSpace(conexao))
{
    throw new InvalidOperationException(
        "A conexão ConexaoSQL não foi configurada."
    );
}

builder.Services.AddDbContext<MaisSegurancaContext>(options =>
    options.UseSqlServer(conexao)
);

// CONFIGURAÇÃO DO CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy
            .SetIsOriginAllowed(origem =>
                origem.StartsWith("http://127.0.0.1:") ||
                origem.StartsWith("http://localhost:") ||
                origem.StartsWith("https://localhost:") ||
                origem.StartsWith("https://127.0.0.1:")
            )
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("Frontend");

app.UseAuthorization();

app.MapControllers();

app.Run();