import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getTasksCollection, serializeTask } from "@/lib/mongodb";
import { isTeamLeader } from "@/lib/authScope";

type Params = { params: Promise<{ id: string }> };

function now() {
  return new Date().toISOString().split("T")[0];
}

async function assertCanModifyTask(sessionEmail: string, isAdmin: boolean, assignedTo: string) {
  if (isAdmin) return null;
  if (await isTeamLeader(sessionEmail)) {
    return NextResponse.json({ error: "Líderes podem apenas visualizar tarefas da equipe" }, { status: 403 });
  }
  if (assignedTo.toLowerCase() !== sessionEmail.toLowerCase()) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const collection = await getTasksCollection();

    const existing = await collection.findOne({ _id: id as any });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const isAdmin = (session.user as any).isAdmin ?? false;
    const denied = await assertCanModifyTask(session.user.email, isAdmin, existing.assignedTo);
    if (denied) return denied;

    const { id: _id, _id: __id, createdAt, ...updates } = body;
    const updatedDoc = { ...updates, updatedAt: now() };

    await collection.updateOne({ _id: id as any }, { $set: updatedDoc });

    const refreshed = await collection.findOne({ _id: id as any });
    return NextResponse.json(serializeTask(refreshed));
  } catch (err) {
    console.error("[PUT /api/tasks/[id]]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const collection = await getTasksCollection();

    const existing = await collection.findOne({ _id: id as any });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const isAdmin = (session.user as any).isAdmin ?? false;
    const denied = await assertCanModifyTask(session.user.email, isAdmin, existing.assignedTo);
    if (denied) return denied;

    await collection.deleteOne({ _id: id as any });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/tasks/[id]]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
