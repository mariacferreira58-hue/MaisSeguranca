-- 1. Criar o banco de dados
IF DB_ID('MaisSeguranca') IS NULL
BEGIN
    CREATE DATABASE MaisSeguranca;
END;
GO

-- 2. Selecionar o banco
USE MaisSeguranca;
GO

-- 3. Criar tabela de Viaturas
IF OBJECT_ID('dbo.Viaturas', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Viaturas (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Placa VARCHAR(10) NOT NULL UNIQUE,
        Marca VARCHAR(50) NOT NULL,
        Modelo VARCHAR(50) NOT NULL,
        Ano INT NOT NULL,
        Quilometragem INT NOT NULL DEFAULT 0,
        Status VARCHAR(20) NOT NULL DEFAULT 'Disponível',
        DataCadastro DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

        CONSTRAINT CK_Viaturas_Ano
            CHECK (Ano BETWEEN 1900 AND 2100),

        CONSTRAINT CK_Viaturas_Quilometragem
            CHECK (Quilometragem >= 0),

        CONSTRAINT CK_Viaturas_Status
            CHECK (Status IN (
                'Disponível',
                'Em manutenção',
                'Inativa'
            ))
    );
END;
GO

-- 4. Criar tabela de Manutenções
IF OBJECT_ID('dbo.Manutencoes', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Manutencoes (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        ViaturaId INT NOT NULL,
        Tipo VARCHAR(20) NOT NULL,
        DataManutencao DATE NOT NULL,
        Quilometragem INT NOT NULL,
        Descricao VARCHAR(500) NOT NULL,
        Custo DECIMAL(10,2) NOT NULL DEFAULT 0,
        Responsavel VARCHAR(100) NULL,

        CONSTRAINT FK_Manutencoes_Viaturas
            FOREIGN KEY (ViaturaId)
            REFERENCES dbo.Viaturas(Id),

        CONSTRAINT CK_Manutencoes_Tipo
            CHECK (Tipo IN (
                'Preventiva',
                'Corretiva'
            )),

        CONSTRAINT CK_Manutencoes_Quilometragem
            CHECK (Quilometragem >= 0),

        CONSTRAINT CK_Manutencoes_Custo
            CHECK (Custo >= 0)
    );
END;
GO

-- 5. Criar tabela de Manutenções Preventivas
IF OBJECT_ID('dbo.Preventivas', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Preventivas (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        ViaturaId INT NOT NULL,
        Descricao VARCHAR(200) NOT NULL,
        DataPrevista DATE NOT NULL,
        QuilometragemPrevista INT NULL,
        Concluida BIT NOT NULL DEFAULT 0,

        CONSTRAINT FK_Preventivas_Viaturas
            FOREIGN KEY (ViaturaId)
            REFERENCES dbo.Viaturas(Id),

        CONSTRAINT CK_Preventivas_Quilometragem
            CHECK (
                QuilometragemPrevista IS NULL
                OR QuilometragemPrevista >= 0
            )
    );
END;
GO

IF OBJECT_ID('dbo.Usuarios', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Usuarios
    (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Nome NVARCHAR(100) NOT NULL,
        Email NVARCHAR(200) NOT NULL,
        SenhaHash NVARCHAR(500) NOT NULL,
        Ativo BIT NOT NULL CONSTRAINT DF_Usuarios_Ativo DEFAULT 1,
        DataCadastro DATETIME2 NOT NULL
            CONSTRAINT DF_Usuarios_DataCadastro DEFAULT SYSDATETIME()
    );

    CREATE UNIQUE INDEX UX_Usuarios_Email
        ON dbo.Usuarios(Email);
END;
GO


-- 6. Conferir as tabelas criadas
SELECT
    TABLE_NAME AS Tabela
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;
GO
