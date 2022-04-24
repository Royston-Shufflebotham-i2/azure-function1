import { CosmosClient } from "@azure/cosmos";

import {
  DefaultAzureCredential,
  ManagedIdentityCredential,
} from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

// const cosmosClient = new CosmosClient({
// });

module.exports = async function (context, req) {
  context.log.info("JavaScript HTTP function processed a request.");

  process.env.AZURE_LOG_LEVEL = "verbose";

  // TODO: env var
  const vaultName = "kv-roystonapplication";
  // TODO: env var
  const secretName = "cosmos-roystonapplication-PrimaryConnectionString";

  const url = `https://${vaultName}.vault.azure.net`;
  const client = new SecretClient(
    url,
    new DefaultAzureCredential({
      // TODO: env var
      managedIdentityClientId: "e43d6465-9ea7-414a-a3ee-c60599041cae",
    })
  );

  const secret = await client.getSecret(secretName);
  context.log.info("secret", secret.name);
  context.log.info("properties", JSON.stringify(secret.properties));

  if (req.scheduleStatus) {
    context.res = {
      body: `Timer-triggered: ${JSON.stringify(req)}`,
    };
    return;
  }

  const name = req.query.name || (req.body && req.body.name);
  const responseMessage = name
    ? "Hello, " + name + ". This HTTP triggered function executed successfully."
    : "This HTTP triggered function executed successfully. Pass a name in the query string or in the request body for a personalized response.";

  return {
    // status: 200, /* Defaults to 200 */
    body: responseMessage,
  };
};
