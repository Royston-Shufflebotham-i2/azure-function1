import { CosmosClient } from "@azure/cosmos";

import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

// const cosmosClient = new CosmosClient({
// });

module.exports = async function (context, req) {
  context.log("JavaScript HTTP function processed a request.");

  const credential = new DefaultAzureCredential();

  const vaultName = "kv-roystonapplication";
  const secretName = "cosmos-roystonapplication-PrimaryConnectionString";

  const url = `https://${vaultName}.vault.azure.net`;
  const client = new SecretClient(url, credential);

  const secret = await client.getSecret(secretName);
  console.log("secret", secret.name);
  console.log("properties", JSON.stringify(secret.properties));

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

  context.res = {
    // status: 200, /* Defaults to 200 */
    body: responseMessage,
  };
};
