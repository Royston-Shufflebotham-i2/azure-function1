import { CosmosClient } from "@azure/cosmos";
import type { Context, HttpRequest, Timer } from "@azure/functions";

const secretFullPath = process.env.I2_COSMOS_CONNECTION_STRING_SECRET_NAME; // keyvaultname/secretname
const managedIdentityClientId = process.env.I2_MANAGED_IDENTITY_CLIENT_ID;

exports.httpTrigger = async (context: Context, req: HttpRequest) => {
  context.log.info("HTTP trigger processing request.");

  if (req.method === "GET") {
    const pkg = require("./package.json");

    return {
      headers: {
        "content-type": "text/html",
      },
      status: 200,
      body: `Function version ${pkg.version}`,
    };
  }

  const name = req.query.name || (req.body && req.body.name);
  const result = await handleRequest(context, name);

  return {
    status: 200,
    body: result,
  };
};

exports.timerTrigger = async (context: Context, timer: Timer) => {
  context.log.info("Timer trigger processing request");
  await handleRequest(context);
};

async function handleRequest(context: Context, name?: string) {
  process.env.AZURE_LOG_LEVEL = "verbose";

  const [vaultName, secretName] = secretFullPath.split("/");
  context.log.info("vars", vaultName, secretName, managedIdentityClientId);

  const cosmosConnectionString = process.env.I2_COSMOS_CONNECTION_STRING;

  const databaseId = "teamsync-db";
  const containerId = "teamsync-teamlessUsers";

  const cosmosClient = new CosmosClient(cosmosConnectionString);
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

  const responseMessage = name
    ? "Hello, " + name + ". This HTTP triggered function executed successfully."
    : "This HTTP triggered function executed successfully. Pass a name in the query string or in the request body for a personalized response.";

  return responseMessage;
}
