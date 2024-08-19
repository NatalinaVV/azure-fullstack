import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { CosmosClient } from "@azure/cosmos";
require('dotenv').config();
 
 
const key = process.env.COSMOS_KEY;
const endpoint = process.env.COSMOS_ENDPOINT;
const databaseName = `humster`;
const container = {'rentals':'rentals'};
 
const cosmosClient = new CosmosClient({ endpoint, key });
 
const database = cosmosClient.database(databaseName);
const containerRentals = database.container(container.rentals);

 
const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('HTTP trigger function processed a request.');
    context.log(req);
    const products = await containerRentals.items.readAll().fetchAll();
 
    context.log(products);
 
    context.res = {
        status: products.resources?  200 : 400, /* Defaults to 200 */
        body: products.resources ? products.resources : context.log("Error with list of resources")
    }; 
};
 
export default httpTrigger;