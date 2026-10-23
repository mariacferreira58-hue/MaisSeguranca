
USE MaisSeguranca;
GO

IF COL_LENGTH('dbo.Manutencoes', 'Status') IS NULL
BEGIN
    ALTER TABLE dbo.Manutencoes
    ADD Status NVARCHAR(30) NOT NULL
        CONSTRAINT DF_Manutencoes_Status
        DEFAULT 'Pendente';
END;
GO
