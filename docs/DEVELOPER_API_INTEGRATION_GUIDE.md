# UabIndia Enterprise Cloud ERP — Developer API & SDK Integration Guide
**API Version:** `v1`  
**Base URL:** `https://api.uabindia.com/api/v1` (Production) / `http://localhost:5000/api/v1` (Local Development)  
**Interactive OpenAPI Portal:** `https://api.uabindia.com/swagger`

---

## 1. Authentication & Security

### 1.1 JWT Bearer Token Authentication
All API requests (except public registration and login) require a JSON Web Token (JWT) in the `Authorization` header:

```http
Authorization: Bearer <your_jwt_access_token>
```

### 1.2 Multi-Tenant Context Headers
To scope API requests to a specific tenant, company entity, or project:

| Header Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `X-Tenant-Id` | `UUID` | **Required** (if not in JWT) | The unique identifier of the tenant workspace. |
| `X-Company-Id` | `UUID` | *Optional* | The active legal company entity within the tenant. |
| `X-Project-Id` | `UUID` | *Optional* | The active project scope for task/timesheet/cost tracking. |
| `Idempotency-Key` | `String` | *Recommended* | Unique UUID for safe retry of payments, invoice creations, and state mutations. |

---

## 2. Authentication Workflows

### 2.1 User Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "tenantDomain": "bharat-tech"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzUxMi...",
  "refreshToken": "d8f3a9b2...",
  "expiresAt": "2026-09-03T00:00:00Z",
  "user": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "email": "user@example.com",
    "fullName": "Vikram Aditya",
    "tenantId": "e1f2a3b4-c5d6-7e8f-9a0b-1c2d3e4f5a6b",
    "role": "TenantAdmin"
  }
}
```

### 2.2 Refresh Token Rotation (RFC 6819)
```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "d8f3a9b2..."
}
```

---

## 3. Dynamic Payroll & Salary Structure API

### 3.1 Create Custom Earning / Deduction Component
```http
POST /api/v1/payroll/components
Content-Type: application/json
Authorization: Bearer <token>
X-Tenant-Id: e1f2a3b4-c5d6-7e8f-9a0b-1c2d3e4f5a6b

{
  "structureId": "4a7b8c9d-0e1f-2a3b-4c5d-6e7f8a9b0c1d",
  "name": "Health Insurance",
  "type": "Deduction",
  "calculationType": "Formula",
  "formula": "(BASIC + HRA) * 0.05",
  "isStatutory": false
}
```

### 3.2 Execute Draft Payroll Run
```http
POST /api/v1/payroll/runs
Content-Type: application/json
Authorization: Bearer <token>

{
  "companyId": "9b8a7c6d-5e4f-3a2b-1c0d-e9f8a7b6c5d4",
  "periodStart": "2026-04-01T00:00:00Z",
  "periodEnd": "2026-04-30T00:00:00Z"
}
```

### 3.3 Finalize Run, Compute Deductions & Post GL Entries
```http
POST /api/v1/payroll/runs/{id}/complete
Authorization: Bearer <token>
```

---

## 4. Financial Invoicing & Indian GST API

### 4.1 Create Sales Invoice with GST Calculation & Section 170 Rounding
```http
POST /api/v1/sales/invoices
Content-Type: application/json
Authorization: Bearer <token>
Idempotency-Key: 7f3b8c9d-4e2a-1b0c-9d8e-7f6a5b4c3d2e

{
  "customerId": "8a7b6c5d-4e3f-2a1b-0c9d-8e7f6a5b4c3d",
  "invoiceDate": "2026-09-02T00:00:00Z",
  "dueDate": "2026-10-02T00:00:00Z",
  "placeOfSupply": "KA",
  "isReverseCharge": false,
  "lines": [
    {
      "itemId": "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
      "description": "Enterprise Cloud ERP Annual License",
      "hsnCode": "998314",
      "quantity": 1,
      "unitPrice": 150000.00,
      "discountAmount": 15000.00,
      "taxRate": 18.00
    }
  ]
}
```

---

## 5. Webhooks & Event Notifications

### 5.1 Webhook Delivery Verification
All outgoing webhooks sent by UabIndia include a cryptographic HMAC-SHA256 signature in the header:

```http
X-UabIndia-Signature: t=1725321600,v1=9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08
```

### 5.2 Node.js Signature Verification Example:
```typescript
import crypto from "crypto";

export function verifyWebhookSignature(
  payload: string,
  signatureHeader: string,
  secretKey: string
): boolean {
  const parts = signatureHeader.split(",");
  const timestamp = parts.find((p) => p.startsWith("t="))?.replace("t=", "");
  const signature = parts.find((p) => p.startsWith("v1="))?.replace("v1=", "");

  if (!timestamp || !signature) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const expectedSignature = crypto
    .createHmac("sha256", secretKey)
    .update(signedPayload)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

---

## 6. Code Examples & SDK Usage

### 6.1 TypeScript / Fetch Client
```typescript
const API_BASE = "https://api.uabindia.com/api/v1";

async function getEmployees(token: string, tenantId: string) {
  const response = await fetch(`${API_BASE}/hrms/employees?page=1&limit=50`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Tenant-Id": tenantId,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`API Error: ${error.title || response.statusText}`);
  }

  return await response.json();
}
```

### 6.2 C# / .NET HttpClient
```csharp
using System.Net.Http.Headers;
using System.Net.Http.Json;

public class UabIndiaApiClient
{
    private readonly HttpClient _http;

    public UabIndiaApiClient(HttpClient http, string token, Guid tenantId)
    {
        _http = http;
        _http.BaseAddress = new Uri("https://api.uabindia.com/api/v1/");
        _http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        _http.DefaultRequestHeaders.Add("X-Tenant-Id", tenantId.ToString());
    }

    public async Task<List<PayslipDto>> GetPayslipsAsync(Guid payrollRunId)
    {
        return await _http.GetFromJsonAsync<List<PayslipDto>>($"payroll/runs/{payrollRunId}/payslips") 
               ?? new List<PayslipDto>();
    }
}
```

### 6.3 Python Client
```python
import requests

def get_journal_entries(token: str, tenant_id: str):
    headers = {
        "Authorization": f"Bearer {token}",
        "X-Tenant-Id": tenant_id,
        "Accept": "application/json"
    }
    response = requests.get("https://api.uabindia.com/api/v1/finance/journal-entries", headers=headers)
    response.raise_for_status()
    return response.json()
```

---

## 7. Error Handling (RFC 7807 Problem Details)

Errors are returned with standard HTTP status codes and RFC 7807 JSON responses:

```json
{
  "type": "https://errors.uabindia.com/validation-error",
  "title": "Validation Failed",
  "status": 400,
  "detail": "One or more validation errors occurred.",
  "instance": "/api/v1/payroll/components",
  "traceId": "00-4bf92f3577b34da6a3ce929d0e0e4736-00",
  "errors": {
    "Name": ["Component name is required."],
    "Formula": ["Invalid formula syntax: unexpected token '++'."]
  }
}
```
