# 14 — Backend Target Architecture (.NET 10)

## Clean Layered Architecture Design

```text
                           REST Clients / Next.js Frontend
                                         │
                                         ▼
                     ┌───────────────────────────────────────┐
                     │          Presentation Layer           │
                     │  Controllers, Middlewares, Filters    │
                     └───────────────────┬───────────────────┘
                                         │
                                         ▼
                     ┌───────────────────────────────────────┐
                     │           Application Layer           │
                     │  Application Services, DTOs, CQRS     │
                     └───────────────────┬───────────────────┘
                                         │
                                         ▼
                     ┌───────────────────────────────────────┐
                     │             Domain Layer              │
                     │  Entities, Value Objects, Rules       │
                     └───────────────────┬───────────────────┘
                                         │
                                         ▼
                     ┌───────────────────────────────────────┐
                     │         Infrastructure Layer          │
                     │  ApplicationDbContext, EF Core, Repos│
                     └───────────────────┬───────────────────┘
                                         │
                                         ▼
                             SQL Server Database
```

## Dedicated Platform Services
1. **`UiPageMetadataService`**: Manages CRUD, versioning, publishing, and caching of `UiPageDefinition` records.
2. **`EntityMetadataDiscoveryService`**: Uses reflection on domain entities combined with `EntityFieldDefinition` custom fields to discover all available fields, types, and validation rules.
3. **`LookupService`**: Provides fast, cached reference data dropdowns for master-data categories.
4. **`NavigationService`**: Serves filtered navigation trees based on user permissions and tenant enabled modules.
5. **`WorkflowEngine`**: Handles state transitions, approval escalations, and outbox notification triggers.
