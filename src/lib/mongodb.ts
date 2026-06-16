import { MongoClient, Db, Collection } from "mongodb";
import type { Task } from "@/types";

const uri = process.env.MONGODB_URI!;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClient: MongoClient | undefined;
}

async function getClient(): Promise<MongoClient> {
  if (!global._mongoClient) {
    global._mongoClient = new MongoClient(uri);
    await global._mongoClient.connect();
  }
  return global._mongoClient;
}

export async function getDb(): Promise<Db> {
  const client = await getClient();
  return client.db("andamento-tarefas");
}

export async function getTasksCollection(): Promise<Collection> {
  const db = await getDb();
  return db.collection("tasks");
}

export function serializeTask(doc: any): Task {
  const { _id, ...rest } = doc;
  return { ...rest, id: _id.toString() } as Task;
}
