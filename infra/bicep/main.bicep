param location string = 'eastus'
param namePrefix string = 'enova'

resource la 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: '${namePrefix}-law'
  location: location
  properties: { retentionInDays: 30 }
}

resource ai 'Microsoft.Insights/components@2020-02-02' = {
  name: '${namePrefix}-appi'
  location: location
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: la.id
  }
}

resource acr 'Microsoft.ContainerRegistry/registries@2023-01-01-preview' = {
  name: '${namePrefix}acr'
  location: location
  sku: { name: 'Basic' }
  properties: { adminUserEnabled: false }
}

resource kv 'Microsoft.KeyVault/vaults@2022-07-01' = {
  name: '${namePrefix}-kv'
  location: location
  properties: {
    tenantId: subscription().tenantId
    sku: { family: 'A'; name: 'standard' }
    enableRbacAuthorization: true
  }
}

resource pg 'Microsoft.DBforPostgreSQL/flexibleServers@2023-03-01-preview' = {
  name: '${namePrefix}-pg'
  location: location
  sku: { name: 'Standard_B1ms', tier: 'Burstable' }
  properties: {
    version: '15'
    storage: { storageSizeGB: 64 }
    administratorLogin: 'pgadmin'
    administratorLoginPassword: 'ChangeMe123!'
    highAvailability: { mode: 'Disabled' }
    backup: { backupRetentionDays: 7 }
    network: { publicNetworkAccess: 'Enabled' }
  }
}

resource cae 'Microsoft.App/managedEnvironments@2024-02-02' = {
  name: '${namePrefix}-cae'
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: la.properties.customerId
        sharedKey: listKeys(la.id, la.apiVersion).primarySharedKey
      }
    }
  }
}
