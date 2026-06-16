import { MongoClient, Db, Collection } from "mongodb";
import type { Task } from "@/types";
import type { SystemObservation } from "@/types/system";
import type { Note } from "@/types/note";

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

export async function getSystemsObsCollection(): Promise<Collection> {
  const db = await getDb();
  return db.collection("systems_obs");
}

export function serializeTask(doc: any): Task {
  const { _id, ...rest } = doc;
  return { ...rest, id: _id.toString() } as Task;
}

export function serializeSystemObs(doc: any): SystemObservation {
  const { _id, ...rest } = doc;
  return rest as SystemObservation;
}

export async function getNotasCollection(): Promise<Collection> {
  const db = await getDb();
  return db.collection("notas");
}

export function serializeNote(doc: any): Note {
  const { _id, ...rest } = doc;
  return { ...rest, id: _id.toString() } as Note;
}
