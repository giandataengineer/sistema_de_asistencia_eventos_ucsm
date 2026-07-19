#!/bin/bash
set -euo pipefail

echo "=== Configurando Firewall (UFW) ==="

if ! command -v ufw &> /dev/null; then
    echo "UFW no instalado. Instalando..."
    sudo apt-get update && sudo apt-get install -y ufw
fi

sudo ufw default deny incoming
sudo ufw default allow outgoing

sudo ufw allow 80/tcp comment "HTTP"
sudo ufw allow 443/tcp comment "HTTPS"
sudo ufw allow 22/tcp comment "SSH"

sudo ufw deny 5432/tcp comment "PostgreSQL bloqueado al exterior"
sudo ufw deny 3306/tcp comment "MySQL bloqueado al exterior"

sudo ufw --force enable
sudo ufw status verbose

echo ""
echo "=== Verificando que PostgreSQL solo escucha en localhost ==="
if command -v psql &> /dev/null; then
    PG_CONF=$(sudo -u postgres psql -t -c "SHOW config_file;" 2>/dev/null | xargs)
    if [ -n "$PG_CONF" ]; then
        PG_DIR=$(dirname "$PG_CONF")
        HBA_FILE="$PG_DIR/pg_hba.conf"
        echo "Config: $PG_CONF"
        echo "HBA: $HBA_FILE"
        echo ""
        echo "Asegurate de que postgresql.conf tenga:"
        echo "  listen_addresses = 'localhost'"
        echo ""
        echo "Y que pg_hba.conf NO tenga lineas con 0.0.0.0/0"
    fi
fi

echo ""
echo "Firewall configurado correctamente."
