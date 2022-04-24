import { CosmosClient } from "@azure/cosmos";
import type { Context } from "@azure/functions";
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

const secretFullPath = process.env.I2_COSMOS_CONNECTION_STRING_SECRET_NAME; // keyvaultname/secretname
const managedIdentityClientId = process.env.I2_MANAGED_IDENTITY_CLIENT_ID;

module.exports = async function (context: Context, req) {
  context.log.info("JavaScript HTTP function processed a request.");

  process.env.AZURE_LOG_LEVEL = "verbose";

  const [vaultName, secretName] = secretFullPath.split("/");
  context.log.info("vars", vaultName, secretName, managedIdentityClientId);

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
  const containerId = "teamsync-teamlessUsers";

  const cosmosClient = new CosmosClient(cosmosConnectionStringSecret.value);
  const dbResponse = await cosmosClient.databases.createIfNotExists({
    id: databaseId,
  });
  const database = dbResponse.database;
  const coResponse = await database.containers.createIfNotExists({
    id: containerId,
    partitionKey: "/user",
    uniqueKeyPolicy: {
      uniqueKeys: [
        {
          paths: ["/user"],
        },
      ],
    },
  });
  const container = coResponse.container;
  const item = {
    user: Date.now().toString(),
    teamlessSince: new Date().toISOString(),
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
