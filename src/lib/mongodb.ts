import { MongoClient, Db, Collection } from "mongodb";
import type { Task } from "@/types";
import type { SystemObservation } from "@/types/system";
import type { Note } from "@/types/note";
import type { Project, UserSettings } from "@/types/project";

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

export async function getProjectsCollection(): Promise<Collection> {
  const db = await getDb();
  return db.collection("projects");
}

export async function getUserSettingsCollection(): Promise<Collection> {
  const db = await getDb();
  return db.collection("user_settings");
}

export function serializeProject(doc: any): Project {
  const { _id, ...rest } = doc;
  return { ...rest, id: _id.toString() } as Project;
}

export function serializeUserSettings(doc: any): UserSettings {
  const { _id, ...rest } = doc;
  return { ...rest, email: _id.toString() } as UserSettings;
}

export function serializeNote(doc: any): Note {
  const { _id, ...rest } = doc;
  return { ...rest, id: _id.toString() } as Note;
}
