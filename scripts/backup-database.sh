#!/usr/bin/env bash
# ==============================================================================
# UabIndia Production Database Backup Script (Automated Cron / Host-Safe)
# Executes SQL Server backup inside the docker container and saves to host ./backups
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Load production environment if DB_PASSWORD is not already set
if [ -z "${DB_PASSWORD:-}" ]; then
    if [ -f "${ROOT_DIR}/.env.production" ]; then
        DB_PASSWORD=$(grep -E '^DB_PASSWORD=' "${ROOT_DIR}/.env.production" | cut -d '=' -f2- | tr -d '"' | tr -d "'" | tr -d '\r')
    elif [ -f "${ROOT_DIR}/.env" ]; then
        DB_PASSWORD=$(grep -E '^DB_PASSWORD=' "${ROOT_DIR}/.env" | cut -d '=' -f2- | tr -d '"' | tr -d "'" | tr -d '\r')
    fi
fi

if [ -z "${DB_PASSWORD:-}" ]; then
    echo "❌ Error: DB_PASSWORD is not set and could not be found in .env.production or .env" >&2
    exit 1
fi

CONTAINER_NAME="${DB_CONTAINER:-uabindia_sqlserver}"
DB_NAME="${DB_NAME:-UabIndia_Enterprise}"
DB_USER="${DB_USER:-sa}"
HOST_BACKUP_DIR="${HOST_BACKUP_DIR:-${ROOT_DIR}/backups}"
CONTAINER_BACKUP_DIR="/var/opt/mssql/backup"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

mkdir -p "${HOST_BACKUP_DIR}"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILENAME="${DB_NAME}_Full_${TIMESTAMP}.bak"
CONTAINER_BACKUP_FILE="${CONTAINER_BACKUP_DIR}/${BACKUP_FILENAME}"
HOST_BACKUP_FILE="${HOST_BACKUP_DIR}/${BACKUP_FILENAME}"
CHECKSUM_FILE="${HOST_BACKUP_FILE}.sha256"

echo "================================================================"
echo " Starting Database Backup for ${DB_NAME} at $(date)"
echo " Container: ${CONTAINER_NAME}"
echo "================================================================"

# Verify container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "❌ Error: Docker container '${CONTAINER_NAME}' is not running!" >&2
    exit 1
fi

# Execute SQL Backup command inside the container
docker exec "${CONTAINER_NAME}" /opt/mssql-tools18/bin/sqlcmd \
  -S localhost \
  -U "${DB_USER}" \
  -P "${DB_PASSWORD}" \
  -C \
  -Q "BACKUP DATABASE [${DB_NAME}] TO DISK = N'${CONTAINER_BACKUP_FILE}' WITH FORMAT, INIT, COMPRESSION, STATS = 10, CHECKSUM;"

# Verify backup exists on host
if [ -f "${HOST_BACKUP_FILE}" ]; then
    echo "✅ [SUCCESS] Backup file created at ${HOST_BACKUP_FILE} ($(du -h "${HOST_BACKUP_FILE}" | cut -f1))"
    
    # Generate SHA-256 Checksum on host
    sha256sum "${HOST_BACKUP_FILE}" > "${CHECKSUM_FILE}"
    echo "✅ [SUCCESS] Generated SHA-256 Checksum."

    # Prune old backups older than RETENTION_DAYS
    find "${HOST_BACKUP_DIR}" -name "*.bak" -type f -mtime +"${RETENTION_DAYS}" -exec rm -f {} +
    find "${HOST_BACKUP_DIR}" -name "*.sha256" -type f -mtime +"${RETENTION_DAYS}" -exec rm -f {} +
    echo "✅ [SUCCESS] Pruned backups older than ${RETENTION_DAYS} days."

    # Backup uploads folder (images, documents, PDFs) if non-empty
    UPLOADS_DIR="${ROOT_DIR}/uploads"
    if [ -d "${UPLOADS_DIR}" ] && [ "$(ls -A "${UPLOADS_DIR}")" ]; then
        UPLOADS_BACKUP_FILE="${HOST_BACKUP_DIR}/UabIndia_Uploads_${TIMESTAMP}.tar.gz"
        tar -czf "${UPLOADS_BACKUP_FILE}" -C "${ROOT_DIR}" uploads
        echo "✅ [SUCCESS] Document/Image uploads snapshot created: ${UPLOADS_BACKUP_FILE}"
        find "${HOST_BACKUP_DIR}" -name "UabIndia_Uploads_*.tar.gz" -type f -mtime +"${RETENTION_DAYS}" -exec rm -f {} +
    fi
else
    echo "❌ Error: Backup completed inside container but file not found on host mount: ${HOST_BACKUP_FILE}" >&2
    exit 1
fi

echo "🎉 Disaster recovery snapshot complete."
