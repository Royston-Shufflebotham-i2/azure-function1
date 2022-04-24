import { CosmosClient } from "@azure/cosmos";

import {
  DefaultAzureCredential,
  ManagedIdentityCredential,
} from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

// const cosmosClient = new CosmosClient({
// });

module.exports = async function (context, req) {
  context.log("JavaScript HTTP function processed a request.");

  process.env.AZURE_LOG_LEVEL = "verbose";

  try {
    const credential = new DefaultAzureCredential();
    const result = await credential.getToken(
      "https://graph.microsoft.com/.default"
    );
    console.log("Default", JSON.stringify(result));
  } catch (e) {
    console.log(`Default fail`, e);
  }

  try {
    const credential = new ManagedIdentityCredential();
    const result = await credential.getToken(
      "https://graph.microsoft.com/.default"
    );
    console.log("Managed", JSON.stringify(result));
  } catch (e) {
    console.log(`Managed fail`, e);
  }

  const vaultName = "kv-roystonapplication";
  const secretName = "cosmos-roystonapplication-PrimaryConnectionString";

  const url = `https://${vaultName}.vault.azure.net`;
  const client = new SecretClient(url, new ManagedIdentityCredential());

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

  return {
    // status: 200, /* Defaults to 200 */
    body: responseMessage,
  };
};
