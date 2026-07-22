import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { getWeeklyReportsCollection, serializeWeeklyReport } from "@/lib/mongodb";

function generateId() {
  return `wr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const weekStart = req.nextUrl.searchParams.get("weekStart");
    if (!weekStart) {
      return NextResponse.json({ error: "weekStart obrigatório" }, { status: 400 });
    }

    const collection = await getWeeklyReportsCollection();
    const doc = await collection.findOne({
      userId: new ObjectId(session.user.id),
      weekStart,
    });

    if (!doc) return NextResponse.json(null);
    return NextResponse.json(serializeWeeklyReport(doc));
  } catch (err) {
    console.error("[GET /api/relatorio-semanal]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const weekStart = String(body.weekStart ?? "").trim();
    if (!weekStart) {
      return NextResponse.json({ error: "weekStart obrigatório" }, { status: 400 });
    }

    const now = new Date().toISOString().split("T")[0];
    const userId = new ObjectId(session.user.id);

    const fields = {
      avancos: String(body.avancos ?? ""),
      impeditivos: String(body.impeditivos ?? ""),
      sugestoes: String(body.sugestoes ?? ""),
      planejamento: String(body.planejamento ?? ""),
      updatedAt: now,
    };

    const collection = await getWeeklyReportsCollection();
    const result = await collection.findOneAndUpdate(
      { userId, weekStart },
      {
        $set: fields,
        $setOnInsert: { _id: generateId() as any, userId, weekStart, createdAt: now },
      },
      { upsert: true, returnDocument: "after" },
    );

    return NextResponse.json(serializeWeeklyReport(result));
  } catch (err) {
    console.error("[POST /api/relatorio-semanal]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
