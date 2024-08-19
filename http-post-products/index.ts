import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { BlobServiceClient, StorageSharedKeyCredential, newPipeline } from "@azure/storage-blob";
import { CosmosClient } from "@azure/cosmos";
import { v4 as uuidv4 } from 'uuid';
require('dotenv').config();

const key = process.env.COSMOS_KEY;
const endpoint = process.env.COSMOS_ENDPOINT;
const BLOB_STORAGE_CONNECTION_STRING = process.env.BLOB_STORAGE_CONNECTION_STRING;
const databaseName = `humster`;
const blobContainerName = process.env.BLOB_CONTAINER_NAME;
const blobSASToken = process.env.BLOB_SAS_TOKEN;

const accountName = process.env.ACCOUNT_NAME;
const accountKey = process.env.ACCOUNT_KEY;

const cosmosClient = new CosmosClient({ endpoint, key });
const database = cosmosClient.database(databaseName);
const containerRentals = database.container('rentals');

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log("HTTP trigger function processed a request.");

    const newRental = req.body;

    try {

        if (newRental.attributes.image) { 
            const imageBuffer = Buffer.from(newRental.attributes.image, 'base64');

            const blobServiceClient = BlobServiceClient.fromConnectionString(`DefaultEndpointsProtocol=https;AccountName=${accountName};AccountKey=${accountKey};EndpointSuffix=core.windows.net`);
            const containerClient = blobServiceClient.getContainerClient(blobContainerName);
            const fileName = `${uuidv4()}.jpeg`;
            const blobClient = containerClient.getBlockBlobClient(fileName);
            await blobClient.upload(imageBuffer, imageBuffer.length);

            // Update the Image URL in rental object
            newRental.attributes.image = `https://${accountName}.blob.core.windows.net/${blobContainerName}/${fileName}?${blobSASToken}`;
        }
            const { resource: createdItem } = await containerRentals.items.create(newRental);

        context.res = {
            status: 201,
            body: createdItem,
        };

    } catch (error) {
        context.log("Error processing request:", error);
        context.res = {
            status: 500,
            body: { error: "Internal Server Error", details: error.message },
        };
    }

};

export default httpTrigger;