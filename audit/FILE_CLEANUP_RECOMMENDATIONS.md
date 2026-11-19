# 🧹 UAB INDIA ENTERPRISE SUITE — FILE CLEANUP & CONSOLIDATION RECOMMENDATIONS
**Document ID:** `AUDIT-DOC-004`  
**Evaluation Date:** November 2026  
**Auditor Roles:** Senior Full-Stack Developer, DevOps Engineer & Technical Project Manager  

---

## 1. Governance & Strict Cleanup Protocols

> [!IMPORTANT]
> **Safety Guardrails**: Under no circumstances should files be automatically deleted or renamed during an ongoing audit. Every removal or consolidation must undergo code-reference verification, build dry-run checks, and explicit stakeholder approval. Package lock files (`package-lock.json`), database migrations, and auto-generated EF Core designer files must remain strictly protected.

---

## 2. Immediate Removal Candidates (Build & Transient Artifacts)

These files are transient build outputs, runtime diagnostic logs, or orphaned artifacts that consume repository storage and add noise to version control:

| File / Folder Path | Size | Reason for Removal | Verification Performed | Recommendation |
| :--- | :--- | :--- | :--- | :--- |
| `infra_build.log` | `2.62 MB` | Build log artifact generated during previous container builds | Confirmed no code, scripts, or runtime components reference this log file. | **[REMOVE CANDIDATE]** Add `*.log` to root `.gitignore` and delete file. |
| `build.log` | `274 KB` | Build log artifact from frontend build | No code dependencies. Pure terminal output dump. | **[REMOVE CANDIDATE]** Delete file. |
| `Backend/src/UabIndia.Api/msbuild.log` | `1.01 MB` | MSBuild diagnostic output file in API project | No code dependencies. Temporary compilation log. | **[REMOVE CANDIDATE]** Delete file. |
| `Backend/src/UabIndia.SharedKernel` | `0 bytes` | Empty folder; no `.csproj`, no classes, no references | Grepped entire solution: neither `UabIndia.sln` nor any `.csproj` references `SharedKernel`. | **[REMOVE CANDIDATE]** Delete directory to avoid architectural ambiguity, or populate if shared kernel pattern is adopted. |

---

## 3. Merge & Consolidation Candidates (Duplicate Files)

| Item 1 (Primary / Target) | Item 2 (Duplicate / Source) | Nature of Redundancy | Resolution Strategy |
| :--- | :--- | :--- | :--- |
| `nginx/nginx.conf` (7.3 KB) | `nginx.conf` (root, 5.6 KB) | Two separate root-level Nginx configuration files exist with slightly diverging upstream definitions. `docker-compose.prod.yml` points to `nginx/nginx.conf`. | **[MERGE]** Merge any missing proxy timeout settings from the root file into `nginx/nginx.conf`. Then delete root `nginx.conf`. |
| `Backend/src/UabIndia.Application/Common/Models/ApiResponse.cs` (4.6 KB) | `Backend/src/UabIndia.Application/Models/ApiResponse.cs` (2.5 KB) | Duplicate API response wrapper class in the same application assembly under two different subnamespaces (`UabIndia.Application.Common.Models` and `UabIndia.Application.Models`). | **[MERGE]** Standardize all controller references to `UabIndia.Application.Common.Models.ApiResponse`, deprecate the redundant copy in `Application/Models/`, and delete after verifying imports. |

---

## 4. Relocation Candidates (Organizational Cleanliness)

| File / Script | Current Path | Proposed Relocated Path | Technical Rationale |
| :--- | :--- | :--- | :--- |
| `deploy.ps1` | `/deploy.ps1` | `scripts/deploy.ps1` | DevOps deployment script belonging with the rest of deployment automation in `scripts/`. |
| `deploy.sh` | `/deploy.sh` | `scripts/deploy.sh` | Bash deployment script belonging in `scripts/`. |
| `DESIGN.md` | `/DESIGN.md` | `docs/DESIGN.md` | Design token and layout guide document belongs in the documentation catalog. |
| `MODULAR_ARCHITECTURE_GUIDE.md`| `/MODULAR_ARCHITECTURE_GUIDE.md`| `docs/architecture/MODULAR_ARCHITECTURE_GUIDE.md`| Master enterprise architecture guide belongs in `docs/architecture/`. |
| `DEPLOYMENT_GUIDE.md` | `/DEPLOYMENT_GUIDE.md` | `docs/DEPLOYMENT_GUIDE.md` | Operations and deployment documentation belongs in `docs/`. |

---

## 5. Working Tree & Git State Reconciliation (`frontend-hrms`)

### Observation:
The git status reveals over 70 unstaged deleted files in `frontend-hrms/src/module/...` and `frontend-hrms/src/engine/...` alongside newly introduced directories (`src/metadata/`, `src/modules/`, `src/services/`).

### Technical Analysis:
A previous architectural initiative successfully migrated `frontend-hrms` from legacy ad-hoc page components to a metadata-driven dynamic engine (`hrmsCatalog.js` + `DynamicHrmsPage.jsx`). The new architecture is fully verified:
- `npm --prefix frontend-hrms run build` transforms 1,822 modules and compiles cleanly in 5.23s.
- However, the old files were left unstaged in the local working copy.

### Recommendation:
Do **NOT** revert or discard these changes. Create a dedicated git commit `chore(hrms): complete metadata engine migration and prune superseded component trees` to formalize this cleanup and establish a clean repository baseline.

---

## 6. Cleanup Verification Checklist Before Action

- [ ] Execute `git status` to ensure all changes are tracked.
- [ ] Run `dotnet build Backend/UabIndia.sln` to confirm no C# project breaks upon removing `SharedKernel` or consolidating `ApiResponse.cs`.
- [ ] Run `dotnet test Backend/tests/UabIndia.Tests/UabIndia.Tests.csproj` (all 375 tests must pass).
- [ ] Run `npm --prefix frontend run typecheck` and `npm --prefix frontend run build`.
- [ ] Run `npm --prefix frontend-hrms run build`.
- [ ] Confirm no Docker Compose file or deployment script references the relocated root files.
