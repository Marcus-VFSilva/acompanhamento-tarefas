import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSystemsObsCollection, serializeSystemObs } from "@/lib/mongodb";
import { SYSTEMS } from "@/data/systems";
import type { SystemWithObs } from "@/types/system";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const collection = await getSystemsObsCollection();
    const obsDocs = await collection.find({}).toArray();
    const obsMap = new Map(obsDocs.map((d) => [d.systemId, serializeSystemObs(d)]));

    const result: SystemWithObs[] = SYSTEMS.map((s) => ({
      ...s,
      obs: obsMap.get(s.id),
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error("[GET /api/sistemas]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
