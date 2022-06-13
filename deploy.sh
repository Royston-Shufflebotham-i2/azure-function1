az deployment group create -f deploy.bicep -g rg-app1 -c --parameters appName=github-user-sync --parameters environmentName=pre-prod --mode Complete
