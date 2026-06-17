import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getTasksCollection, serializeTask } from "@/lib/mongodb";
import { getTaskVisibilityQuery, isTeamLeader } from "@/lib/authScope";
import initialData from "@/data/tasks.json";

function generateId() {
  return `t_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function now() {
  return new Date().toISOString().split("T")[0];
}

async function seedIfEmpty(collection: Awaited<ReturnType<typeof getTasksCollection>>) {
  const count = await collection.countDocuments();
  if (count === 0) {
    const docs = initialData.tasks.map((t) => ({ _id: t.id, ...t }));
    await collection.insertMany(docs as any);
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = (session.user as any).isAdmin ?? false;
    const collection = await getTasksCollection();

    await seedIfEmpty(collection);

    const query = await getTaskVisibilityQuery(session.user.email, isAdmin);
    const docs = await collection.find(query).sort({ updatedAt: -1 }).toArray();

    return NextResponse.json(docs.map(serializeTask));
  } catch (err) {
    console.error("[GET /api/tasks]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = (session.user as any).isAdmin ?? false;
    const collection = await getTasksCollection();

    await seedIfEmpty(collection);

    const leader = await isTeamLeader(session.user.email);
    if (leader && !isAdmin) {
      return NextResponse.json({ error: "Líderes não podem criar tarefas pela visão de equipe" }, { status: 403 });
    }

    const body = await req.json();
    const id = generateId();
    const today = now();

    const task = {
      _id: id,
      ...body,
      id,
      assignedTo: body.assignedTo || session.user.email,
      assignedToName: body.assignedToName || session.user.name || session.user.email,
      createdAt: today,
      updatedAt: today,
    };

    await collection.insertOne(task as any);

    return NextResponse.json(serializeTask(task), { status: 201 });
  } catch (err) {
    console.error("[POST /api/tasks]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
