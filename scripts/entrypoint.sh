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

profile="${DEPLOYMENT_PROFILE:-local-trusted}"
port="${PORT:-3333}"
net_allowlist="${DENO_NET_ALLOWLIST:-}"
run_allowlist="${DENO_RUN_ALLOWLIST:-}"

case "$profile" in
    local-trusted)
        deno_flags=(
            "--allow-read=/app,/workspace,/tmp"
            "--allow-write=/workspace,/app/backend/cert"
            "--allow-net"
            "--allow-env"
            "--allow-run=git,node,npx,deno,openssl,script"
        )
        ;;
    remote-shared)
        network_flag="--allow-net=0.0.0.0:${port},localhost:${port},127.0.0.1:${port}"
        if [ -n "$net_allowlist" ]; then
            network_flag="${network_flag},${net_allowlist}"
        fi
        run_flag="--allow-run=git"
        if [ -n "$run_allowlist" ]; then
            run_flag="${run_flag},${run_allowlist}"
        fi
        deno_flags=(
            "--allow-read=/app/backend,/app/frontend/dist,/app/_bmad,/workspace,/tmp"
            "--allow-write=/workspace"
            "$network_flag"
            "--allow-env=HOME,USERPROFILE,PORT,LAPDEV_HOST,FRONTEND_PORT,ALLOWED_ORIGINS,WORKSPACE_PATH,TLS_ENABLED,TLS_CERT_PATH,TLS_KEY_PATH,VERSION,NODE_ENV,CAPABILITY_POLICY_PROFILE,CAPABILITY_ALLOWLIST,WORKSPACE_ID,LAPDEV_AI_API_KEY,LAPDEV_REMOTE_ACCESS_TOKEN,LAPDEV_KV_PATH,DEPLOYMENT_PROFILE,DENO_NET_ALLOWLIST,DENO_RUN_ALLOWLIST"
            "$run_flag"
        )
        ;;
    *)
        echo "[ERROR] Invalid deployment profile: ${profile}" >&2
        exit 1
        ;;
esac

exec deno run --no-lock "${deno_flags[@]}" backend/src/main.ts
