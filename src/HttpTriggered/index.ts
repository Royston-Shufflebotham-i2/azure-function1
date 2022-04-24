import { CosmosClient } from "@azure/cosmos";

import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

const vaultName = process.env.I2_KEY_VAULT_NAME; // kv-blah-blah
const secretName = process.env.I2_COSMOS_CONNECTION_STRING_SECRET_NAME;
const managedIdentityClientId = process.env.I2_MANAGED_IDENTITY_CLIENT_ID;

module.exports = async function (context, req) {
  context.log.info("JavaScript HTTP function processed a request.");

  process.env.AZURE_LOG_LEVEL = "verbose";

  const credential = new DefaultAzureCredential({
    managedIdentityClientId,
  });

  const url = `https://${vaultName}.vault.azure.net`;
  const client = new SecretClient(url, credential);

  const cosmosConnectionStringSecret = await client.getSecret(secretName);
  context.log.info("secret", cosmosConnectionStringSecret.name);
  context.log.info(
    "properties",
    JSON.stringify(cosmosConnectionStringSecret.properties)
  );

  const databaseId = "teamsync-db";
  const containerId = "teamsync-container";

  const cosmosClient = new CosmosClient(cosmosConnectionStringSecret.value);
  const dbResponse = await cosmosClient.databases.createIfNotExists({
    id: databaseId,
  });
  const database = dbResponse.database;
  const coResponse = await database.containers.createIfNotExists({
    id: containerId,
    partitionKey: "/id",
    uniqueKeyPolicy: {
      uniqueKeys: [
        {
          paths: ["/id"],
        },
      ],
    },
  });
  const container = coResponse.container;
  const item = {
    id: Date.now().toString(),
    somethingElse: new Date().toString(),
  };
  await container.items.create(item);

  const name = req.query.name || (req.body && req.body.name);
  const responseMessage = name
    ? "Hello, " + name + ". This HTTP triggered function executed successfully."
    : "This HTTP triggered function executed successfully. Pass a name in the query string or in the request body for a personalized response.";

  return {
    // status: 200, /* Defaults to 200 */
    body: responseMessage,
  };
};
