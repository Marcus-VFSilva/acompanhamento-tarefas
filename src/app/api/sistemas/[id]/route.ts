import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSystemsObsCollection } from "@/lib/mongodb";
import { SYSTEMS } from "@/data/systems";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const system = SYSTEMS.find((s) => s.id === id);
    if (!system) {
      return NextResponse.json({ error: "Sistema não encontrado" }, { status: 404 });
    }

    const body = await req.json();
    const now = new Date().toISOString().split("T")[0];

    const obs = {
      systemId: id,
      uptime: body.uptime ?? undefined,
      observacao: body.observacao ?? undefined,
      ultimaVerificacao: body.ultimaVerificacao ?? undefined,
      updatedAt: now,
      updatedBy: session.user.email,
    };

    const collection = await getSystemsObsCollection();
    await collection.updateOne(
      { systemId: id },
      { $set: obs },
      { upsert: true }
    );

    return NextResponse.json(obs);
  } catch (err) {
    console.error("[PUT /api/sistemas/[id]]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
