# Database Schema & Migrations

All legacy manual `.sql` files have been cleaned up and removed from this directory.

## Canonical Architecture: Pure C# EF Core Code-First

The application manages all database schemas, tables, columns, indexes, and initial seeding **purely in C# code**:

1. **Entity Models (C#)**: Defined in `Backend/src/UabIndia.Core/Entities/`.
2. **EF Core Migrations (C#)**: Generated versioned classes in `Backend/src/UabIndia.Infrastructure/Data/Migrations/*.cs`.
3. **Automated Application on Startup**: Managed by `DatabaseInitializationService` via `db.Database.MigrateAsync()`.
4. **No `.sql` Files Needed**: Adding or modifying database entities does not require manual `.sql` script files.

To add new tables or columns:
```powershell
cd Backend/src/UabIndia.Api
dotnet ef migrations add <MigrationName> --project ../UabIndia.Infrastructure
```
Migrations will automatically execute on application startup.
