# 08 — Legacy & Deprecated Code Audit

## Executive Summary
Audit of obsolete routes, legacy controller aliases, and deprecated DTOs.

## Classification Framework

| Item | Type | Current Status | Recommended Action | Deprecation Target |
| :--- | :--- | :--- | :--- | :--- |
| `/dashboard` | Legacy Alias | Redirects to `/administration` | **KEEP (Edge Redirect)** | Indefinite (User Bookmark Safety) |
| `/hrms/departments` | Legacy Path | Redirects to `/administration/departments` | **MIGRATE** | Wave 8 Cleanup |
| `/hrms/designations` | Legacy Path | Redirects to `/administration/designations` | **MIGRATE** | Wave 8 Cleanup |
| `/procurement/grn` | Legacy Abbreviation | Redirects to `/procurement/goods-receipt-notes` | **KEEP (Edge Redirect)** | Wave 8 Cleanup |
| `/inventory/wms` | Legacy Abbreviation | Redirects to `/inventory/warehouse-management` | **KEEP (Edge Redirect)** | Wave 8 Cleanup |
| `/security/mfa` | Legacy Abbreviation | Redirects to `/platform/security/mfa` | **KEEP (Edge Redirect)** | Wave 8 Cleanup |
| `OldApi/*` | Deprecated Routes | Replaced by `/api/v1/*` | **REMOVE AFTER VERIFICATION** | After integration audit |
