import { MongoClient } from 'mongodb';
import { NextResponse } from 'next/server';
import dotenv from 'dotenv';

dotenv.config();
const MONGODB_URI = process.env.MONGODB_URI;

let client: MongoClient | null = null;

async function getMongoClient() {
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

async function getLatestChat() {
  const client = await getMongoClient();
  const db = client.db("virtuals_backroom");
  const collections = await db.listCollections().toArray();
  const sortedCollections = collections.sort((a, b) => b.name.localeCompare(a.name));
  const latestChat = sortedCollections[0];
  return db.collection(latestChat.name);
}

export async function GET() {
  try {
    const chat = await getLatestChat();
    const documents = await chat.find().limit(200).toArray();
    const json = JSON.stringify(documents);
    return NextResponse.json(json);
  } catch (error) {
    console.error('Failed to fetch documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}
