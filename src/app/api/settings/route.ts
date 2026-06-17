import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserSettingsCollection, serializeUserSettings } from "@/lib/mongodb";
import type { UserSettingsResponse } from "@/types/project";

function emailToName(email: string): string {
  return email
    .split("@")[0]
    .split(".")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = session.user.email.toLowerCase();
    const collection = await getUserSettingsCollection();

    let doc = await collection.findOne({ _id: email as any });
    if (!doc) {
      const newDoc = {
        _id: email,
        name: session.user.name ?? emailToName(email),
        managerEmail: undefined,
        managerName: undefined,
      };
      await collection.insertOne(newDoc as any);
      doc = await collection.findOne({ _id: email as any });
    }

    if (!doc) {
      return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
    }

    const subordinates = await collection
      .find({ managerEmail: email })
      .toArray();

    const response: UserSettingsResponse = {
      ...serializeUserSettings(doc),
      isManager: subordinates.length > 0,
      subordinates: subordinates.map((s) => ({
        email: s._id.toString(),
        name: s.name ?? emailToName(s._id.toString()),
      })),
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("[GET /api/settings]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = session.user.email.toLowerCase();
    const body = await req.json();
    const collection = await getUserSettingsCollection();

    const managerEmail =
      body.managerEmail !== undefined
        ? body.managerEmail?.trim().toLowerCase() || undefined
        : undefined;
    const managerName =
      body.managerName !== undefined ? body.managerName?.trim() || undefined : undefined;
    const emailSignature =
      body.emailSignature !== undefined ? body.emailSignature?.trim() || undefined : undefined;

    if (managerEmail === email) {
      return NextResponse.json({ error: "Você não pode ser seu próprio gestor" }, { status: 400 });
    }

    const $set: Record<string, unknown> = {
      name: session.user.name ?? emailToName(email),
    };
    const $unset: Record<string, string> = {};

    if (body.managerEmail !== undefined) {
      $set.managerEmail = managerEmail;
      $set.managerName = managerEmail ? (managerName || emailToName(managerEmail)) : undefined;
    }

    if (body.emailSignature !== undefined) {
      $set.emailSignature = emailSignature;
    }

    if (body.emailSignatureImage !== undefined) {
      const imageData = typeof body.emailSignatureImage === "string" ? body.emailSignatureImage.trim() : "";
      if (imageData) {
        if (imageData.length > 1_200_000) {
          return NextResponse.json({ error: "Imagem muito grande (máx. ~900 KB)" }, { status: 400 });
        }
        $set.emailSignatureImage = imageData;
        $set.emailSignatureImageMime = body.emailSignatureImageMime?.trim() || "image/png";
      } else {
        $unset.emailSignatureImage = "";
        $unset.emailSignatureImageMime = "";
      }
    }

    await collection.updateOne(
      { _id: email as any },
      {
        $set,
        ...(Object.keys($unset).length > 0 ? { $unset } : {}),
        $setOnInsert: { _id: email },
      },
      { upsert: true }
    );

    const doc = await collection.findOne({ _id: email as any });
    if (!doc) {
      return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
    }
    const subordinates = await collection.find({ managerEmail: email }).toArray();

    const response: UserSettingsResponse = {
      ...serializeUserSettings(doc),
      isManager: subordinates.length > 0,
      subordinates: subordinates.map((s) => ({
        email: s._id.toString(),
        name: s.name ?? emailToName(s._id.toString()),
      })),
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("[PUT /api/settings]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
