# Setup Guide — Azure NextAuth Stack

This guide takes you from zero → local dev → Azure deploy.

## 0) Prereqs

- Node 20+, pnpm: `corepack enable && corepack prepare pnpm@latest --activate`
- Azure CLI: `az login`, correct subscription selected.
- Stripe account, GitHub account.
- (Optional) Azure OpenAI access.

## 1) Clone and configure

### Environment Setup

```bash
cp .env.example .env.local
```

**Important**: You'll also need to create a `.env` file specifically for Prisma (it only needs DATABASE_URL):

```bash
# Create .env file with just DATABASE_URL for Prisma
echo "DATABASE_URL=your_database_connection_string_here" > .env
```

**Fill `.env.local` with:**

- `NEXTAUTH_SECRET` (generate one: `openssl rand -base64 32`)
- `NEXTAUTH_URL` - Set to your devtunnel URL for local development (see step 7)
- `DATABASE_URL` - PostgreSQL connection string for your local database
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` (see Google OAuth setup below)
- Stripe keys (test mode) - optional
- AI provider: `AI_PROVIDER=azure` and enter Azure OpenAI keys, or switch to `openai` - optional

**Fill `.env` with:**

- `DATABASE_URL` only (Prisma reads this file for database operations)

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google People API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set application type to "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (for local dev)
   - `https://your-devtunnel-url.devtunnels.ms/api/auth/callback/google` (for webhook testing)
7. Copy the Client ID and Client Secret to your `.env.local` files

## 2) Database Setup (Local Development)

### Option A: Local PostgreSQL

1. Install PostgreSQL locally
2. Create a database: `createdb your_app_db`
3. Set `DATABASE_URL` in both `.env` and `.env.local`:
   ```

   DATABASE_URL="postgresql://username:password@localhost:5432/your_app_db"
   ```

### Initialize Database

```bash
# Install dependencies
pnpm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init
```

## 3) Install & run locally

```bash
pnpm dev
```

Visit http://localhost:3000

**Note**: Authentication won't work fully until you set up devtunnels (step 7) and configure Google OAuth properly.

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

## 7) Dev Tunnels for local webhooks and OAuth

**Important**: For Google OAuth to work in local development, you need a public URL:

```bash
# Create a dev tunnel with anonymous access. THis is often set to your default
devtunnel create enova -a

# Add a port to your default dev tunnel 
devtunnel port create -p 3000

# Begin hosting your tunnel
devtunnel host
```

This will give you a public URL like: `https://randomstring23824732.devtunnels.ms`

**Update your environment files:**
1. Set `NEXTAUTH_URL=https://your-tunnel-url.devtunnels.ms` in both `.env` and `.env.local`
2. Add this URL to your Google OAuth authorized redirect URIs:
   - `https://your-tunnel-url.devtunnels.ms/api/auth/callback/google`

**Uses:**
- Google OAuth callbacks: `https://your-tunnel-url.devtunnels.ms/api/auth/callback/google`
- Stripe webhooks: `https://your-tunnel-url.devtunnels.ms/api/webhooks/stripe`

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