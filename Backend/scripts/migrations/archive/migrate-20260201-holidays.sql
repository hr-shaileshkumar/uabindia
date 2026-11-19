-- Holidays table for HRMS leave management
-- Add to existing database after migrate-20260201.sql

BEGIN TRANSACTION;

CREATE TABLE Holidays (
    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    TenantId UNIQUEIDENTIFIER NOT NULL,
    Name NVARCHAR(256) NOT NULL,
    Date DATE NOT NULL,
    Type NVARCHAR(32) NOT NULL DEFAULT 'Public', -- Public, Optional, Regional
    IsOptional BIT NOT NULL DEFAULT 0,
    Description NVARCHAR(1024) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NULL,
    CreatedBy UNIQUEIDENTIFIER NULL,
    IsDeleted BIT NOT NULL DEFAULT 0,
    CONSTRAINT FK_Holidays_Tenants FOREIGN KEY (TenantId) REFERENCES Tenants(Id)
);

CREATE INDEX IX_Holidays_Tenant_Date ON Holidays (TenantId, Date);

-- Seed sample holidays for demo tenant (India 2026)
DECLARE @DemoTenantId UNIQUEIDENTIFIER;
SELECT @DemoTenantId = Id FROM Tenants WHERE Subdomain = 'demo';

IF @DemoTenantId IS NOT NULL
BEGIN
    INSERT INTO Holidays (TenantId, Name, Date, Type, IsOptional, Description)
    VALUES 
        (@DemoTenantId, 'Republic Day', '2026-01-26', 'Public', 0, 'National Holiday - India'),
        (@DemoTenantId, 'Holi', '2026-03-14', 'Public', 0, 'Festival of Colors'),
        (@DemoTenantId, 'Good Friday', '2026-04-03', 'Public', 0, 'Christian Holiday'),
        (@DemoTenantId, 'Independence Day', '2026-08-15', 'Public', 0, 'National Holiday - India'),
        (@DemoTenantId, 'Gandhi Jayanti', '2026-10-02', 'Public', 0, 'National Holiday'),
        (@DemoTenantId, 'Diwali', '2026-10-30', 'Public', 0, 'Festival of Lights'),
        (@DemoTenantId, 'Christmas', '2026-12-25', 'Public', 0, 'Christian Holiday'),
        (@DemoTenantId, 'Eid-ul-Fitr', '2026-04-21', 'Optional', 1, 'Islamic Festival'),
        (@DemoTenantId, 'Eid-ul-Adha', '2026-06-28', 'Optional', 1, 'Islamic Festival');
END

COMMIT;
