import {MongoClient} from 'mongodb';
import * as dotenv from "dotenv";

let client: MongoClient | null = null;

dotenv.config();
const MONGODB_URI = process.env.MONGODB_URI;

export async function getMongoClient() {
    if (!client) {
        try {
            client = new MongoClient(MONGODB_URI as string);
            await client.connect();
            console.log('Connected to MongoDB');
        } catch (error) {
            console.error('Failed to connect to MongoDB:', error);
            throw new Error('Failed to connect to MongoDB');
        }
    }
    return client;
}

export async function getDatabaseVitualsBackroom() {
    const client = await getMongoClient();
    const db = client.db("virtuals_backroom");
    return db;
}

export async function getLatestChat() {
    const client = await getMongoClient();
    const db = client.db("virtuals_backroom");
    const collections = await db.listCollections().toArray();
    const sortedCollections = collections.sort((a, b) => b.name.localeCompare(a.name));
    const latestChat = sortedCollections[0];
    return db.collection(latestChat.name);
}
  