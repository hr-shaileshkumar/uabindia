#!/bin/bash
# ==============================================================================
# UabIndia SaaS ERP - Database Disaster Recovery & Restore Script
# Usage: ./scripts/restore-database.sh ./backups/UabIndia_Enterprise_Full_YYYYMMDD_HHMMSS.bak
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

BACKUP_ARCHIVE="${1:-}"

if [ -z "${BACKUP_ARCHIVE}" ] || [ ! -f "${BACKUP_ARCHIVE}" ]; then
  echo "❌ Error: Please specify a valid .bak or .bak.gz backup file to restore."
  echo "Usage: $0 ./backups/UabIndia_Enterprise_Full_XXXXXXXX_XXXXXX.bak"
  exit 1
fi

# Load DB_PASSWORD if not already in environment
if [ -z "${DB_PASSWORD:-}" ]; then
    if [ -f "${ROOT_DIR}/.env.production" ]; then
        DB_PASSWORD=$(grep -E '^DB_PASSWORD=' "${ROOT_DIR}/.env.production" | cut -d '=' -f2- | tr -d '"' | tr -d "'" | tr -d '\r')
    elif [ -f "${ROOT_DIR}/.env" ]; then
        DB_PASSWORD=$(grep -E '^DB_PASSWORD=' "${ROOT_DIR}/.env" | cut -d '=' -f2- | tr -d '"' | tr -d "'" | tr -d '\r')
    fi
fi

if [ -z "${DB_PASSWORD:-}" ]; then
  echo "❌ Error: DB_PASSWORD must be provided or configured in .env.production."
  exit 1
fi

CONTAINER_NAME="${DB_CONTAINER:-uabindia_sqlserver}"
DB_NAME="${DB_NAME:-UabIndia_Enterprise}"

echo "======================================================================"
echo "⚠️  WARNING: Starting Database Restore for: ${DB_NAME}"
echo "📁 Source File: ${BACKUP_ARCHIVE}"
echo "🐳 Container:   ${CONTAINER_NAME}"
echo "======================================================================"

# Verify container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "❌ Error: Docker container '${CONTAINER_NAME}' is not running!" >&2
    exit 1
fi

# Decompress if gzipped
CLEANUP_TMP=false
if [[ "${BACKUP_ARCHIVE}" == *.gz ]]; then
  echo "📦 Decompressing backup archive..."
  TMP_BAK="/tmp/restore_temp_$(date +%s).bak"
  gunzip -c "${BACKUP_ARCHIVE}" > "${TMP_BAK}"
  RESTORE_SRC="${TMP_BAK}"
  CLEANUP_TMP=true
else
  RESTORE_SRC="${BACKUP_ARCHIVE}"
fi

# Copy into container restore staging location
echo "📤 Copying backup file into container staging area..."
docker cp "${RESTORE_SRC}" "${CONTAINER_NAME}:/var/opt/mssql/restore_temp.bak"

# Execute SQL Server Restore Command
echo "🔄 Restoring database..."
docker exec "${CONTAINER_NAME}" /opt/mssql-tools18/bin/sqlcmd \
  -S localhost \
  -U sa \
  -P "${DB_PASSWORD}" \
  -C \
  -Q "
    ALTER DATABASE [${DB_NAME}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    RESTORE DATABASE [${DB_NAME}] FROM DISK = N'/var/opt/mssql/restore_temp.bak' WITH REPLACE;
    ALTER DATABASE [${DB_NAME}] SET MULTI_USER;
  "

# Cleanup container temp file
docker exec "${CONTAINER_NAME}" rm -f "/var/opt/mssql/restore_temp.bak"
if [ "${CLEANUP_TMP}" = true ]; then
  rm -f "${RESTORE_SRC}"
fi

echo "======================================================================"
echo "✅ Database ${DB_NAME} has been successfully restored and is ONLINE!"
echo "======================================================================"
