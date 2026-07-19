#!/bin/bash
set -euo pipefail

SSHD_CONFIG="/etc/ssh/sshd_config"
BACKUP_FILE="/etc/ssh/sshd_config.backup.$(date +%Y%m%d)"

echo "=== Hardening SSH ==="

if [ ! -f "$BACKUP_FILE" ]; then
    sudo cp "$SSHD_CONFIG" "$BACKUP_FILE"
    echo "Backup creado: $BACKUP_FILE"
fi

apply_setting() {
    local key="$1"
    local value="$2"
    if sudo grep -qE "^#?\s*${key}\s" "$SSHD_CONFIG"; then
        sudo sed -i "s/^#\?\s*${key}\s.*/${key} ${value}/" "$SSHD_CONFIG"
    else
        echo "${key} ${value}" | sudo tee -a "$SSHD_CONFIG" > /dev/null
    fi
    echo "  $key = $value"
}

echo "Aplicando configuracion segura..."
apply_setting "PasswordAuthentication" "no"
apply_setting "PermitRootLogin" "no"
apply_setting "PubkeyAuthentication" "yes"
apply_setting "PermitEmptyPasswords" "no"
apply_setting "MaxAuthTries" "3"
apply_setting "ClientAliveInterval" "300"
apply_setting "ClientAliveCountMax" "2"
apply_setting "X11Forwarding" "no"
apply_setting "AllowAgentForwarding" "no"
apply_setting "Protocol" "2"

echo ""
echo "Validando configuracion..."
if sudo sshd -t 2>&1; then
    echo "Configuracion valida."
    echo ""
    echo "IMPORTANTE: Antes de reiniciar SSH, asegurate de tener"
    echo "una llave SSH configurada y probada en ~/.ssh/authorized_keys"
    echo ""
    echo "Para aplicar los cambios ejecuta:"
    echo "  sudo systemctl restart sshd"
else
    echo "ERROR: Configuracion invalida. Restaurando backup..."
    sudo cp "$BACKUP_FILE" "$SSHD_CONFIG"
    echo "Backup restaurado."
    exit 1
fi
