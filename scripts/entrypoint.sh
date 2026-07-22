#!/bin/bash

set -e

adjust_workspace_permissions() {
    if [ -d "/workspace" ]; then
        local workspace_owner=$(stat -c "%u:%g" /workspace)
        local workspace_uid=$(stat -c "%u" /workspace)
        local workspace_gid=$(stat -c "%g" /workspace)
        
        echo "[INFO] Workspace owner: $workspace_owner"
        
        local current_uid=$(id -u lapdev)
        local current_gid=$(id -g lapdev)
        
        if [ "$workspace_uid" != "$current_uid" ]; then
            echo "[INFO] Adjusting lapdev UID from $current_uid to $workspace_uid to match workspace owner"
            usermod -u "$workspace_uid" lapdev 2>/dev/null || true
        fi
        
        if [ "$workspace_gid" != "$current_gid" ]; then
            echo "[INFO] Adjusting lapdev GID from $current_gid to $workspace_gid to match workspace owner"
            groupmod -g "$workspace_gid" lapdev 2>/dev/null || true
        fi
        
        echo "[INFO] Setting workspace permissions"
        chown -R lapdev:lapdev /workspace 2>/dev/null || true
        
        local new_owner=$(stat -c "%u:%g" /workspace)
        echo "[INFO] Updated workspace owner: $new_owner"
    else
        echo "[WARN] Workspace directory /workspace does not exist"
    fi
}

generate_tls_cert() {
    if [ "$TLS_ENABLED" = "true" ] && [ ! -f /app/backend/cert/cert.pem ]; then
        echo "[INFO] Generating TLS certificate..."
        openssl genrsa -out /app/backend/cert/key.pem 2048
        openssl req -new -key /app/backend/cert/key.pem -out /tmp/cert.csr -subj "/CN=localhost"
        printf 'subjectAltName=DNS:localhost,DNS:lapdev,IP:127.0.0.1\nextendedKeyUsage=serverAuth\nkeyUsage=digitalSignature,keyEncipherment\n' > /tmp/extfile.cnf
        openssl x509 -req -in /tmp/cert.csr -signkey /app/backend/cert/key.pem -out /app/backend/cert/cert.pem -days 365 -extfile /tmp/extfile.cnf -sha256
        rm -f /tmp/cert.csr /tmp/extfile.cnf
        chown lapdev:lapdev /app/backend/cert/*
        echo "[INFO] TLS certificate generated"
    fi
}

echo "[INFO] Lapdev Entrypoint starting..."

adjust_workspace_permissions

generate_tls_cert

echo "[INFO] Starting Deno server..."
exec deno run --no-lock -A backend/src/main.ts