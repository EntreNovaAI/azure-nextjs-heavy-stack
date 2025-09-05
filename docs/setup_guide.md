# Setup Guide — Azure NextAuth Stack

This guide takes you from zero → local dev → Azure deploy.

## 0) Prereqs
- Node 20+, pnpm: `corepack enable && corepack prepare pnpm@latest --activate`
- Azure CLI: `az login`, correct subscription selected.
- Stripe account, GitHub account.
- (Optional) Azure OpenAI access.

## 1) Clone and configure
```bash
cp .env.example .env.local

Fill:

. NEXTAUTH_SECRET (generate one: openssl rand -base64 32)
. For local dev, set DATABASE_URL to a local Postgres or leave empty for now.
. Stripe keys (test mode).
. Set AI provider: AI_PROVIDER=azure and enter Azure OpenAI keys, or switch to openai.

## 2) Install & run locally
pnpm i
pnpm dev


Visit http://localhost:3000

## 3) Create Azure infra
export RG=enova-rg
export LOC=eastus
export PFX=enova
bash scripts/az_deploy_infra.sh


This creates: Log Analytics, App Insights, ACR, Key Vault, Postgres, Container Apps environment.
Create the Container App once via Portal or:

az containerapp create \
  --name enova-app --resource-group $RG \
  --environment enova-cae \
  --image mcr.microsoft.com/azuredocs/containerapps-helloworld:latest \
  --ingress external --target-port 3000 \
  --system-assigned

## 4) Put secrets in Key Vault
export KV=enova-kv
# Required secrets (example values)
az keyvault secret set --vault-name $KV --name NEXTAUTH_SECRET --value "prod_secret_here"
az keyvault secret set --vault-name $KV --name DATABASE_URL --value "postgresql://USER:PASSWORD@HOST:5432/DB?sslmode=require"
az keyvault secret set --vault-name $KV --name STRIPE_SECRET_KEY --value "sk_test_..."
az keyvault secret set --vault-name $KV --name STRIPE_WEBHOOK_SECRET --value "whsec_..."
az keyvault secret set --vault-name $KV --name NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY --value "pk_test_..."
# AI
az keyvault secret set --vault-name $KV --name AZURE_OPENAI_API_KEY --value "<key>"
az keyvault secret set --vault-name $KV --name AZURE_OPENAI_ENDPOINT --value "https://<your-aoai>.openai.azure.com"
az keyvault secret set --vault-name $KV --name AZURE_OPENAI_DEPLOYMENT --value "gpt-4o-mini"
# Storage
az keyvault secret set --vault-name $KV --name AZURE_STORAGE_CONNECTION_STRING --value "<conn str>"
# Realtime
az keyvault secret set --vault-name $KV --name AZURE_WEB_PUBSUB_CONNECTION_STRING --value "<conn str>"
# Telemetry
az keyvault secret set --vault-name $KV --name APPINSIGHTS_CONNECTION_STRING --value "<conn str>"

## 5) Bind KV → Container App
export APP=enova-app
bash scripts/az_bind_secrets.sh

## 6) Migrate DB (first run)
Temporarily export your prod DATABASE_URL locally:

export DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB?sslmode=require"
bash scripts/prisma_migrate.sh

## 7) Dev Tunnels for local webhooks
az dev-tunnel create --name enova --port 3000 --allow-anonymous
az dev-tunnel host --port 3000


Use the public URL for Stripe webhooks, e.g.
https://enova-12345.devtunnels.ms/api/webhooks/stripe

## 8) GitHub → build → deploy
Create a new GitHub repo and push.
In GitHub → Settings → Secrets and variables → Actions, add:
. AZURE_SUBSCRIPTION_ID, AZURE_TENANT_ID, AZURE_CLIENT_ID (OIDC federated credentials)
. AZURE_RG=enova-rg, ACR_NAME=<your acr name>, AZURE_CONTAINER_APP=enova-app

Push to main. The action builds and updates the Container App image.
App uses secrets already bound from Key Vault.

## 9) Custom domain / CDN (optional)
. Put Front Door in front of the Container App hostname.
. Add your domain, TLS cert, and WAF if needed.
. Update NEXT_PUBLIC_BASE_URL in KV and recycle the app.

## 10) Observability
. Application Insights auto-collects Node logs.
. Query logs in Log Analytics workspace.
. Add alerts for 5xx rate, CPU, Memory.

## 11) Realtime (Web PubSub)
. Use lib/webpubsub.ts to send messages to clients.
. Client connects via WebSocket using generated token (add a route to mint tokens).

---
# Notes

Why JWT sessions in NextAuth?
. They work well with the App Router and middleware without sticky sessions or server storage. You can still persist user data in Postgres for joins/RBAC; the JWT just carries identity.

Why Container Apps?
. You get blue/green revisions, scale-to-zero, and simple Docker deploys without running Kubernetes.

Why Key Vault bindings?
. Secrets never live in GitHub or the app image; ACA reads them at runtime via Managed Identity.

Why Dev Tunnels?
. Same function as ngrok, but Microsoft-native and easy for webhook testing.

Why Azure OpenAI toggle?
. Some customers require AOAI (governance/data residency). The env flip lets you demo either with no code change.

---