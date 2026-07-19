#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_SCRIPT="$SCRIPT_DIR/backup-db.sh"
LOG_FILE="/var/log/asistepro-backup.log"

echo "=== Configurando Cron Job para Backups Diarios ==="

chmod +x "$BACKUP_SCRIPT"

CRON_LINE="0 2 * * * DATABASE_URL=\"\$DATABASE_URL\" $BACKUP_SCRIPT >> $LOG_FILE 2>&1"

if crontab -l 2>/dev/null | grep -qF "$BACKUP_SCRIPT"; then
    echo "Cron job ya existe. No se duplicara."
else
    (crontab -l 2>/dev/null; echo "$CRON_LINE") | crontab -
    echo "Cron job agregado: backup diario a las 2:00 AM"
fi

sudo touch "$LOG_FILE"
sudo chmod 644 "$LOG_FILE"

echo ""
echo "Cron jobs actuales:"
crontab -l
echo ""
echo "Logs en: $LOG_FILE"
