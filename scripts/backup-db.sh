#!/bin/bash
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/asistepro}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/asistepro_$TIMESTAMP.sql.gz"

if [ -z "${DATABASE_URL:-}" ]; then
    echo "ERROR: DATABASE_URL no configurada"
    exit 1
fi

mkdir -p "$BACKUP_DIR"

echo "[$TIMESTAMP] Iniciando backup de base de datos..."

pg_dump "$DATABASE_URL" --no-owner --no-privileges | gzip > "$BACKUP_FILE"

FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "[$TIMESTAMP] Backup creado: $BACKUP_FILE ($FILE_SIZE)"

DELETED=$(find "$BACKUP_DIR" -name "asistepro_*.sql.gz" -mtime +"$RETENTION_DAYS" -print -delete | wc -l)
if [ "$DELETED" -gt 0 ]; then
    echo "[$TIMESTAMP] Eliminados $DELETED backups con mas de $RETENTION_DAYS dias"
fi

echo "[$TIMESTAMP] Backup completado exitosamente"
