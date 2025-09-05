#!/usr/bin/env bash
set -euo pipefail
RG=${RG:-"enova-rg"}
APP=${APP:-"enova-app"}
KV=${KV:-"enova-kv"}

VARS=(DATABASE_URL NEXTAUTH_SECRET STRIPE_SECRET_KEY STRIPE_WEBHOOK_SECRET NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY AZURE_OPENAI_API_KEY AZURE_OPENAI_ENDPOINT AZURE_OPENAI_DEPLOYMENT OPENAI_API_KEY AZURE_STORAGE_CONNECTION_STRING AZURE_WEB_PUBSUB_CONNECTION_STRING APPINSIGHTS_CONNECTION_STRING)

for V in "${VARS[@]}"; do
  az containerapp secret set --name "$APP" --resource-group "$RG" \
    --secrets "$V=^fromkeyvault^/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RG/providers/Microsoft.KeyVault/vaults/$KV/secrets/$V"
done

MAP=""
for V in "${VARS[@]}"; do
  MAP="$MAP $V=$V"
done

az containerapp update --name "$APP" --resource-group "$RG" --set-env-vars-from-secret $MAP
echo "Secrets bound from Key Vault to Container App."
