#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.prod.yml"

# Check .env exists
if [ ! -f "$SCRIPT_DIR/.env" ]; then
    echo "ERROR: deploy/.env not found. Copy .env.production.example to .env and fill in values."
    exit 1
fi

# Load env vars
set -a
source "$SCRIPT_DIR/.env"
set +a

DOMAINS="${DOMAIN:-vetly.gr}"
EMAIL="${CERTBOT_EMAIL}"

if [ -z "$EMAIL" ]; then
    echo "ERROR: CERTBOT_EMAIL not set in .env"
    exit 1
fi

echo "=== Let's Encrypt SSL Setup ==="
echo "Domains: $DOMAINS, api.$DOMAINS"
echo "Email: $EMAIL"
echo ""

CERT_PATH="/etc/letsencrypt/live/$DOMAINS"

# Step 1: Create dummy certificate so nginx can start
echo "[1/4] Creating dummy certificate..."
docker compose -f "$COMPOSE_FILE" --env-file "$SCRIPT_DIR/.env" run --rm --entrypoint "" certbot sh -c "
    mkdir -p $CERT_PATH &&
    openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
        -keyout $CERT_PATH/privkey.pem \
        -out $CERT_PATH/fullchain.pem \
        -subj '/CN=localhost'
"

# Step 2: Start nginx with dummy cert
echo "[2/4] Starting nginx..."
docker compose -f "$COMPOSE_FILE" --env-file "$SCRIPT_DIR/.env" up -d nginx

# Step 3: Delete dummy cert and request real one
echo "[3/4] Requesting real certificate..."
docker compose -f "$COMPOSE_FILE" --env-file "$SCRIPT_DIR/.env" run --rm --entrypoint "" certbot sh -c "
    rm -rf /etc/letsencrypt/live/$DOMAINS &&
    rm -rf /etc/letsencrypt/archive/$DOMAINS &&
    rm -rf /etc/letsencrypt/renewal/$DOMAINS.conf
"

docker compose -f "$COMPOSE_FILE" --env-file "$SCRIPT_DIR/.env" run --rm --entrypoint "" certbot certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    -d "$DOMAINS" \
    -d "api.$DOMAINS"

# Step 4: Reload nginx with real cert
echo "[4/4] Reloading nginx..."
docker compose -f "$COMPOSE_FILE" --env-file "$SCRIPT_DIR/.env" exec nginx nginx -s reload

echo ""
echo "=== SSL setup complete ==="
echo "Certificates installed for: $DOMAINS, api.$DOMAINS"
