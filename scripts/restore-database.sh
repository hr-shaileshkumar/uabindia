#!/bin/bash
# ==============================================================================
# UabIndia SaaS ERP - Database Disaster Recovery & Restore Script
# Usage: ./scripts/restore-database.sh ./backups/UabIndia_HRMS_backup_YYYYMMDD_HHMMSS.bak.gz
# ==============================================================================

set -e

BACKUP_ARCHIVE="$1"
DB_NAME="${DB_NAME:-UabIndia_HRMS}"
DB_PASSWORD="${DB_PASSWORD:-YourSecurePassword123!}"

if [ -z "$BACKUP_ARCHIVE" ] || [ ! -f "$BACKUP_ARCHIVE" ]; then
  echo "❌ Error: Please specify a valid .bak or .bak.gz backup file to restore."
  echo "Usage: $0 ./backups/UabIndia_HRMS_backup_XXXXXXXX.bak.gz"
  exit 1
fi

echo "======================================================================"
echo "⚠️  WARNING: Starting Database Restore for: $DB_NAME"
echo "📁 Source File: $BACKUP_ARCHIVE"
echo "======================================================================"

# Decompress if gzipped
if [[ "$BACKUP_ARCHIVE" == *.gz ]]; then
  echo "📦 Decompressing backup archive..."
  TMP_BAK="/tmp/restore_temp.bak"
  gunzip -c "$BACKUP_ARCHIVE" > "$TMP_BAK"
else
  TMP_BAK="$BACKUP_ARCHIVE"
fi

# Copy into container
echo "📤 Copying backup file into database container..."
docker cp "$TMP_BAK" "uabindia-sqlserver:/var/opt/mssql/restore_temp.bak"

# Execute SQL Server Restore Command
echo "🔄 Restoring database..."
docker exec uabindia-sqlserver /opt/mssql-tools/bin/sqlcmd \
  -S localhost \
  -U sa \
  -P "$DB_PASSWORD" \
  -Q "
    ALTER DATABASE [$DB_NAME] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    RESTORE DATABASE [$DB_NAME] FROM DISK = N'/var/opt/mssql/restore_temp.bak' WITH REPLACE;
    ALTER DATABASE [$DB_NAME] SET MULTI_USER;
  "

# Cleanup
docker exec uabindia-sqlserver rm "/var/opt/mssql/restore_temp.bak"
if [[ "$BACKUP_ARCHIVE" == *.gz ]]; then
  rm -f "$TMP_BAK"
fi

echo "======================================================================"
echo "✅ Database $DB_NAME has been successfully restored!"
echo "======================================================================"
