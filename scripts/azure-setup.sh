#!/usr/bin/env bash
#
# Azure Container Apps — one-time setup script
#
# What this script does:
#   1. Creates a Resource Group (a folder for all your Azure resources)
#   2. Creates a Container Registry (where Docker images are stored)
#   3. Creates a Container App Environment + Container App (where your app runs)
#   4. Sets up OIDC federation so GitHub Actions can deploy without passwords
#   5. Prints every GitHub secret you need to configure
#
# Prerequisites:
#   - Azure CLI installed and logged in (`az login`)
#   - GitHub repo: RoshanJ20/podcastgt
#
# Usage:
#   chmod +x scripts/azure-setup.sh
#   ./scripts/azure-setup.sh

set -euo pipefail

# ──────────────────────────────────────────────
# Configuration — edit these if you want
# ──────────────────────────────────────────────
RESOURCE_GROUP="podcasthub-rg"
LOCATION="eastus"
ACR_NAME="podcasthubacr"          # must be globally unique, lowercase, no dashes
APP_ENV_NAME="podcasthub-env"
APP_NAME="podcasthub-app"
GITHUB_REPO="RoshanJ20/podcastgt"

# ──────────────────────────────────────────────
# Step 1: Resource Group
# ──────────────────────────────────────────────
# A resource group is like a folder — it holds all related Azure resources
# together so you can manage (or delete) them as a unit.
echo "═══ Step 1/5: Creating Resource Group ═══"
az group create \
  --name "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --output none
echo "✓ Resource group '$RESOURCE_GROUP' created in $LOCATION"

# ──────────────────────────────────────────────
# Step 2: Azure Container Registry (ACR)
# ──────────────────────────────────────────────
# ACR is a private Docker registry. GitHub Actions will push your Docker
# image here, and Container Apps will pull from it to run your app.
echo ""
echo "═══ Step 2/5: Creating Container Registry ═══"
az acr create \
  --resource-group "$RESOURCE_GROUP" \
  --name "$ACR_NAME" \
  --sku Basic \
  --admin-enabled true \
  --output none
ACR_LOGIN_SERVER=$(az acr show --name "$ACR_NAME" --query loginServer -o tsv)
echo "✓ Container Registry created: $ACR_LOGIN_SERVER"

# ──────────────────────────────────────────────
# Step 3: Container App Environment + App
# ──────────────────────────────────────────────
# The Environment is the underlying infrastructure (networking, logging).
# The App is your actual running container inside that environment.
echo ""
echo "═══ Step 3/5: Creating Container App ═══"

# Create the environment (takes ~1 min)
az containerapp env create \
  --name "$APP_ENV_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --output none
echo "✓ Container App Environment '$APP_ENV_NAME' created"

# Create the app with a placeholder image (will be replaced on first deploy)
# --ingress external: makes it publicly accessible via HTTPS
# --target-port 3000: your Next.js app listens on port 3000
az containerapp create \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --environment "$APP_ENV_NAME" \
  --image "mcr.microsoft.com/k8se/quickstart:latest" \
  --target-port 3000 \
  --ingress external \
  --min-replicas 0 \
  --max-replicas 1 \
  --output none

APP_FQDN=$(az containerapp show \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query properties.configuration.ingress.fqdn -o tsv)
echo "✓ Container App created: https://$APP_FQDN"

# Allow the Container App to pull images from ACR
az containerapp registry set \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --server "$ACR_LOGIN_SERVER" \
  --username "$ACR_NAME" \
  --password "$(az acr credential show --name "$ACR_NAME" --query 'passwords[0].value' -o tsv)" \
  --output none
echo "✓ ACR registry linked to Container App"

# ──────────────────────────────────────────────
# Step 4: GitHub OIDC Federation
# ──────────────────────────────────────────────
# Instead of storing Azure passwords in GitHub, we create a trust relationship.
# GitHub Actions proves its identity via OIDC token, and Azure trusts it
# because we register the exact repo + branch that's allowed to authenticate.
echo ""
echo "═══ Step 4/5: Setting up GitHub OIDC Federation ═══"

SUBSCRIPTION_ID=$(az account show --query id -o tsv)
TENANT_ID=$(az account show --query tenantId -o tsv)

# Create an Entra ID (Azure AD) app registration
APP_ID=$(az ad app create --display-name "podcasthub-github-deploy" --query appId -o tsv)
echo "✓ App registration created (Client ID: $APP_ID)"

# Create a service principal for the app
SP_OBJ_ID=$(az ad sp create --id "$APP_ID" --query id -o tsv)
echo "✓ Service principal created"

# Add federated credential — this tells Azure to trust tokens from GitHub
# but ONLY for pushes to the main branch of your specific repo
az ad app federated-credential create \
  --id "$APP_ID" \
  --parameters "{
    \"name\": \"github-main-branch\",
    \"issuer\": \"https://token.actions.githubusercontent.com\",
    \"subject\": \"repo:${GITHUB_REPO}:ref:refs/heads/main\",
    \"audiences\": [\"api://AzureADTokenExchange\"]
  }" \
  --output none
echo "✓ Federated credential created for $GITHUB_REPO (main branch)"

# Grant permissions:
# - AcrPush: allows pushing Docker images to the registry
# - Contributor on resource group: allows updating the Container App
ACR_ID=$(az acr show --name "$ACR_NAME" --query id -o tsv)

az role assignment create \
  --assignee-object-id "$SP_OBJ_ID" \
  --assignee-principal-type ServicePrincipal \
  --role AcrPush \
  --scope "$ACR_ID" \
  --output none
echo "✓ AcrPush role assigned"

az role assignment create \
  --assignee-object-id "$SP_OBJ_ID" \
  --assignee-principal-type ServicePrincipal \
  --role Contributor \
  --scope "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP" \
  --output none
echo "✓ Contributor role assigned on resource group"

# ──────────────────────────────────────────────
# Step 5: Print GitHub Secrets
# ──────────────────────────────────────────────
echo ""
echo "═══ Step 5/5: GitHub Secrets ═══"
echo ""
echo "Go to: https://github.com/$GITHUB_REPO/settings/secrets/actions"
echo "Add each of these as a Repository Secret:"
echo ""
echo "┌─────────────────────────────────┬──────────────────────────────────────────┐"
echo "│ Secret Name                     │ Value                                    │"
echo "├─────────────────────────────────┼──────────────────────────────────────────┤"
printf "│ %-31s │ %-40s │\n" "AZURE_CLIENT_ID"        "$APP_ID"
printf "│ %-31s │ %-40s │\n" "AZURE_TENANT_ID"        "$TENANT_ID"
printf "│ %-31s │ %-40s │\n" "AZURE_SUBSCRIPTION_ID"  "$SUBSCRIPTION_ID"
printf "│ %-31s │ %-40s │\n" "ACR_LOGIN_SERVER"       "$ACR_LOGIN_SERVER"
printf "│ %-31s │ %-40s │\n" "CONTAINER_APP_NAME"     "$APP_NAME"
printf "│ %-31s │ %-40s │\n" "RESOURCE_GROUP"         "$RESOURCE_GROUP"
printf "│ %-31s │ %-40s │\n" "NEXT_PUBLIC_APP_URL"    "https://$APP_FQDN"
echo "├─────────────────────────────────┼──────────────────────────────────────────┤"
echo "│ You also need these (from your  │                                          │"
echo "│ Supabase + OpenAI dashboards):  │                                          │"
echo "├─────────────────────────────────┼──────────────────────────────────────────┤"
printf "│ %-31s │ %-40s │\n" "NEXT_PUBLIC_SUPABASE_URL"      "(your Supabase project URL)"
printf "│ %-31s │ %-40s │\n" "NEXT_PUBLIC_SUPABASE_ANON_KEY" "(your Supabase anon key)"
printf "│ %-31s │ %-40s │\n" "SUPABASE_SERVICE_ROLE_KEY"     "(your Supabase service role key)"
printf "│ %-31s │ %-40s │\n" "OPENAI_API_KEY"                "(your OpenAI API key)"
echo "└─────────────────────────────────┴──────────────────────────────────────────┘"
echo ""
echo "═══ Done! ═══"
echo "Your app will be live at: https://$APP_FQDN"
echo "Push to 'main' to trigger the first deploy."
