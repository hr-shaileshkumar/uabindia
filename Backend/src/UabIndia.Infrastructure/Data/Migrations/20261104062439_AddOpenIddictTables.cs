using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UabIndia.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddOpenIddictTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF OBJECT_ID(N'[dbo].[OpenIddictApplications]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[OpenIddictApplications] (
        [Id] nvarchar(450) NOT NULL PRIMARY KEY,
        [ApplicationType] nvarchar(50) NULL,
        [ClientId] nvarchar(100) NULL,
        [ClientSecret] nvarchar(max) NULL,
        [ClientType] nvarchar(50) NULL,
        [ConcurrencyToken] nvarchar(50) NULL,
        [ConsentType] nvarchar(50) NULL,
        [DisplayName] nvarchar(max) NULL,
        [DisplayNames] nvarchar(max) NULL,
        [JsonWebKeySet] nvarchar(max) NULL,
        [Permissions] nvarchar(max) NULL,
        [PostLogoutRedirectUris] nvarchar(max) NULL,
        [Properties] nvarchar(max) NULL,
        [RedirectUris] nvarchar(max) NULL,
        [Requirements] nvarchar(max) NULL,
        [Settings] nvarchar(max) NULL
    );
    CREATE UNIQUE NONCLUSTERED INDEX [IX_OpenIddictApplications_ClientId]
        ON [dbo].[OpenIddictApplications] ([ClientId]) WHERE [ClientId] IS NOT NULL;
END;

IF OBJECT_ID(N'[dbo].[OpenIddictScopes]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[OpenIddictScopes] (
        [Id] nvarchar(450) NOT NULL PRIMARY KEY,
        [ConcurrencyToken] nvarchar(50) NULL,
        [Description] nvarchar(max) NULL,
        [Descriptions] nvarchar(max) NULL,
        [DisplayName] nvarchar(max) NULL,
        [DisplayNames] nvarchar(max) NULL,
        [Name] nvarchar(200) NULL,
        [Properties] nvarchar(max) NULL,
        [Resources] nvarchar(max) NULL
    );
    CREATE UNIQUE NONCLUSTERED INDEX [IX_OpenIddictScopes_Name]
        ON [dbo].[OpenIddictScopes] ([Name]) WHERE [Name] IS NOT NULL;
END;

IF OBJECT_ID(N'[dbo].[OpenIddictAuthorizations]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[OpenIddictAuthorizations] (
        [Id] nvarchar(450) NOT NULL PRIMARY KEY,
        [ApplicationId] nvarchar(450) NULL,
        [ConcurrencyToken] nvarchar(50) NULL,
        [CreationDate] datetime2 NULL,
        [Properties] nvarchar(max) NULL,
        [Scopes] nvarchar(max) NULL,
        [Status] nvarchar(50) NULL,
        [Subject] nvarchar(400) NULL,
        [Type] nvarchar(50) NULL,
        CONSTRAINT [FK_OpenIddictAuthorizations_OpenIddictApplications_ApplicationId] FOREIGN KEY ([ApplicationId])
            REFERENCES [dbo].[OpenIddictApplications] ([Id])
    );
    CREATE NONCLUSTERED INDEX [IX_OpenIddictAuthorizations_ApplicationId_Status_Subject_Type]
        ON [dbo].[OpenIddictAuthorizations] ([ApplicationId], [Status], [Subject], [Type]);
END;

IF OBJECT_ID(N'[dbo].[OpenIddictTokens]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[OpenIddictTokens] (
        [Id] nvarchar(450) NOT NULL PRIMARY KEY,
        [ApplicationId] nvarchar(450) NULL,
        [AuthorizationId] nvarchar(450) NULL,
        [ConcurrencyToken] nvarchar(50) NULL,
        [CreationDate] datetime2 NULL,
        [ExpirationDate] datetime2 NULL,
        [Payload] nvarchar(max) NULL,
        [Properties] nvarchar(max) NULL,
        [RedemptionDate] datetime2 NULL,
        [ReferenceId] nvarchar(100) NULL,
        [Status] nvarchar(50) NULL,
        [Subject] nvarchar(400) NULL,
        [Type] nvarchar(150) NULL,
        CONSTRAINT [FK_OpenIddictTokens_OpenIddictApplications_ApplicationId] FOREIGN KEY ([ApplicationId])
            REFERENCES [dbo].[OpenIddictApplications] ([Id]),
        CONSTRAINT [FK_OpenIddictTokens_OpenIddictAuthorizations_AuthorizationId] FOREIGN KEY ([AuthorizationId])
            REFERENCES [dbo].[OpenIddictAuthorizations] ([Id])
    );
    CREATE NONCLUSTERED INDEX [IX_OpenIddictTokens_ApplicationId_Status_Subject_Type]
        ON [dbo].[OpenIddictTokens] ([ApplicationId], [Status], [Subject], [Type]);
    CREATE NONCLUSTERED INDEX [IX_OpenIddictTokens_AuthorizationId]
        ON [dbo].[OpenIddictTokens] ([AuthorizationId]);
    CREATE UNIQUE NONCLUSTERED INDEX [IX_OpenIddictTokens_ReferenceId]
        ON [dbo].[OpenIddictTokens] ([ReferenceId]) WHERE [ReferenceId] IS NOT NULL;
END;
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "OpenIddictTokens");

            migrationBuilder.DropTable(
                name: "OpenIddictAuthorizations");

            migrationBuilder.DropTable(
                name: "OpenIddictScopes");

            migrationBuilder.DropTable(
                name: "OpenIddictApplications");
        }
    }
}
