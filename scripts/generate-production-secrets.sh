#!/usr/bin/env bash
# ==============================================================================
# UabIndia SaaS ERP - Linux/macOS Production Cryptographic Secrets Generator
# Generates high-entropy random keys for JWT (512-bit), AES-256-GCM, and HMAC
# ==============================================================================

set -euo pipefail

echo "======================================================================"
echo "🔐 UabIndia ERP - Cryptographic Production Secrets Generator"
echo "======================================================================"

JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
AES_KEY=$(openssl rand -base64 32 | tr -d '\n')
HMAC_KEY=$(openssl rand -base64 32 | tr -d '\n')
DB_PASS=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 24)"!A1"
REDIS_PASS=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 24)

echo "✅ Generated High-Entropy Cryptographic Keys:"
echo " - JWT Secret (512-bit):        ${JWT_SECRET:0:16}..."
echo " - AES-256 Master Key:          ${AES_KEY:0:16}..."
echo " - HMAC Blind Index Key:        ${HMAC_KEY:0:16}..."
echo " - Generated DB Password:       ${DB_PASS:0:10}..."
echo " - Generated Redis Password:    ${REDIS_PASS:0:10}..."

if [ -f ".env.production.example" ]; then
    sed -e "s|CHANGE_THIS_TO_YOUR_SECURE_512_BIT_RANDOM_JWT_SECRET_KEY_MIN_64_CHARS|${JWT_SECRET}|g" \
        -e "s|CHANGE_THIS_TO_YOUR_SECURE_256_BIT_AES_GCM_BASE64_KEY_32_BYTES|${AES_KEY}|g" \
        -e "s|CHANGE_THIS_TO_YOUR_SECURE_256_BIT_HMAC_SHA256_BASE64_KEY_32_BYTES|${HMAC_KEY}|g" \
        -e "s|YOUR_SECURE_COMPLEX_PASSWORD_HERE|${DB_PASS}|g" \
        -e "s|YOUR_REDIS_PASSWORD|${REDIS_PASS}|g" \
        .env.production.example > .env.production

    chmod 600 .env.production
    echo "🎉 Secrets successfully written to .env.production (mode 600)!"
    echo "⚠️  IMPORTANT: Keep .env.production secure and never commit it to git."
fi
