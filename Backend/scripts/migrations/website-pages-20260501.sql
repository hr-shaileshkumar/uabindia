-- ============================================================
-- Migration: website-pages-20260501
-- Adds WebsitePages table for tenant-specific website content management
-- Safe to run multiple times (IF OBJECT_ID guards table creation)
-- ============================================================

IF OBJECT_ID('dbo.WebsitePages', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.WebsitePages (
        Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        TenantId UNIQUEIDENTIFIER NOT NULL,
        PageType NVARCHAR(50) NOT NULL, -- 'home', 'about', 'contact', 'career'
        Title NVARCHAR(256) NOT NULL,
        ContentJson NVARCHAR(MAX) NOT NULL DEFAULT '{}',
        IsPublished BIT NOT NULL DEFAULT 0,
        PublishedAt DATETIME2 NULL,
        PublishedBy UNIQUEIDENTIFIER NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NULL,
        CreatedBy UNIQUEIDENTIFIER NULL,
        IsDeleted BIT NOT NULL DEFAULT 0,
        CONSTRAINT FK_WebsitePages_Tenants FOREIGN KEY (TenantId) REFERENCES dbo.Tenants(Id),
        CONSTRAINT UQ_WebsitePages_Tenant_PageType UNIQUE (TenantId, PageType)
    );

    CREATE INDEX IX_WebsitePages_TenantId ON dbo.WebsitePages(TenantId);
    CREATE INDEX IX_WebsitePages_PageType ON dbo.WebsitePages(PageType);
    CREATE INDEX IX_WebsitePages_IsPublished ON dbo.WebsitePages(IsPublished);
END