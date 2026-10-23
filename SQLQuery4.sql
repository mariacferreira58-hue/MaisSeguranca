
USE MaisSeguranca;
GO

IF COL_LENGTH('dbo.Preventivas', 'Status') IS NULL
BEGIN
    ALTER TABLE dbo.Preventivas
    ADD Status NVARCHAR(30) NOT NULL
        CONSTRAINT DF_Preventivas_Status
        DEFAULT 'Agendada';
END;
GO

IF COL_LENGTH('dbo.Preventivas', 'Observacoes') IS NULL
BEGIN
    ALTER TABLE dbo.Preventivas
    ADD Observacoes NVARCHAR(MAX) NULL;
END;
GO
