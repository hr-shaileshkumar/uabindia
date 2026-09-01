#!/usr/bin/env bash
# ==============================================================================
# UabIndia Production Database Backup Script (Linux / Docker)
# ==============================================================================

set -euo pipefail

DB_SERVER="${DB_SERVER:-sqlserver}"
DB_NAME="${DB_NAME:-UabIndia_Enterprise}"
DB_USER="${DB_USER:-sa}"
DB_PASS="${DB_PASS:-UabIndia_SecureProd2026!}"
BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

mkdir -p "${BACKUP_DIR}"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_Full_${TIMESTAMP}.bak"
CHECKSUM_FILE="${BACKUP_FILE}.sha256"

echo "================================================================"
echo " Starting Database Backup for ${DB_NAME} at $(date)"
echo "================================================================"

# Execute SQL Backup command
/opt/mssql-tools18/bin/sqlcmd \
  -S "${DB_SERVER}" \
  -U "${DB_USER}" \
  -P "${DB_PASS}" \
  -C \
  -Q "BACKUP DATABASE [${DB_NAME}] TO DISK = N'${BACKUP_FILE}' WITH FORMAT, INIT, COMPRESSION, STATS = 10, CHECKSUM;"

echo "[SUCCESS] Backup file created at ${BACKUP_FILE}"

# Generate SHA-256 Checksum
sha256sum "${BACKUP_FILE}" > "${CHECKSUM_FILE}"
echo "[SUCCESS] Generated SHA-256 Checksum."

# Clean up older backups
find "${BACKUP_DIR}" -name "*.bak" -type f -mtime +"${RETENTION_DAYS}" -exec rm -f {} +
find "${BACKUP_DIR}" -name "*.sha256" -type f -mtime +"${RETENTION_DAYS}" -exec rm -f {} +
echo "[SUCCESS] Pruned backups older than ${RETENTION_DAYS} days."
