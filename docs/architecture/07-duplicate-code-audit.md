# 07 — Duplication & Redundancy Audit

## Executive Summary
Analysis of the 192 frontend pages and 108 backend controllers revealed distinct patterns of duplicate boilerplate and parallel implementations.

## Identified Duplications & Canonical Implementations

### 1. Table Management & Pagination Boilerplate
- **Duplicate Pattern**: 40+ pages re-implement standard pagination state (`page`, `pageSize`, `search`, `filter`, `sortColumn`, `sortDirection`) and manual search debouncing.
- **Canonical Solution**: Standardize on `useErpListView()` hook and `DynamicTable` component.
- **Migration Risk**: Low. Simplifies codebase by removing ~150 lines of boilerplate per page.

### 2. Status Badge Formatter Duplication
- **Duplicate Pattern**: Over 55 components define identical `getStatusBadge(status: string)` helper functions mapping `"Active"` to green, `"Pending"` to yellow, `"Rejected"` to red.
- **Canonical Solution**: Standardize on `<StatusBadge status={status} />` component utilizing centralized theme tokens.

### 3. Duplicate Navigation Aliases
- **Prior Status**: Duplicate dummy redirect files existed for `mss`, `ess`, `wms`, `grn`, `edi`, `mfa`, `sso`.
- **Status**: Removed. Replaced with edge-level canonical 301/308 redirects in `middleware.ts`.

### 4. Backend CRUD Controller Repetition
- **Duplicate Pattern**: Standard CRUD controllers repeat repetitive `GetById`, `GetAll`, `Create`, `Update`, `Delete` boilerplate with identical mapping.
- **Canonical Solution**: Introduce generic `CrudControllerBase<TEntity, TDto, TCreateDto, TKey>` to eliminate 70% of repetitive controller code while retaining domain overrides.
