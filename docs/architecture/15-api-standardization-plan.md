# 15 — API Standardization & Versioning Strategy

## Standard REST API Convention
All enterprise APIs must adhere to the following RESTful contract:

```text
GET    /api/v1/{module}/{resource}            # List with pagination, sorting, filters
GET    /api/v1/{module}/{resource}/{id}       # Retrieve single entity
POST   /api/v1/{module}/{resource}            # Create new entity
PUT    /api/v1/{module}/{resource}/{id}       # Full update of entity
PATCH  /api/v1/{module}/{resource}/{id}       # Partial update
DELETE /api/v1/{module}/{resource}/{id}       # Soft-delete entity
POST   /api/v1/{module}/{resource}/bulk-delete# Batch deletion
GET    /api/v1/{module}/{resource}/export     # CSV / Excel export
```

## Standardized Envelope Contract (`ApiResponse<T>`)

```csharp
public class ApiResponse<T>
{
    public bool Success { get; set; } = true;
    public string? Message { get; set; }
    public T? Data { get; set; }
    public List<string>? Errors { get; set; }
    public ApiMeta? Meta { get; set; }
}

public class PagedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
}
```

## Migration Strategy for Existing Endpoints
- **Non-Breaking Guarantee**: Existing endpoints continue to function unchanged.
- New endpoints are introduced under `/api/v1/*`.
- Deprecated legacy routes issue standard HTTP headers:
  - `Deprecation: true`
  - `Sunset: 2027-01-01`
