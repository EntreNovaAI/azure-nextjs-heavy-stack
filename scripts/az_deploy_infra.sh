#!/usr/bin/env bash
set -euo pipefail

RG=${RG:-"enova-rg"}
LOC=${LOC:-"eastus"}
PFX=${PFX:-"enova"}

az group create -n "$RG" -l "$LOC"
az deployment group create -g "$RG" -f infra/bicep/main.bicep -p location="$LOC" namePrefix="$PFX"

echo "Infra deployed to resource group: $RG"
