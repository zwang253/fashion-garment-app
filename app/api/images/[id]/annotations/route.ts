import { NextResponse } from "next/server.js";

import { addAnnotation } from "../../../../../lib/repository.ts";
import type { Annotation } from "../../../../../lib/types.ts";

export const dynamic = "force-dynamic";

function buildAnnotation(kind: Annotation["kind"], value: string): Annotation {
  return {
    id: crypto.randomUUID(),
    kind,
    value,
    createdAt: new Date().toISOString(),
  };
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const imageId = Number.parseInt(id, 10);
    if (Number.isNaN(imageId)) {
      return NextResponse.json({ error: "Invalid image id." }, { status: 400 });
    }

    const payload = (await request.json()) as { note?: string; tags?: string };
    const annotations = [
      payload.note?.trim() ? buildAnnotation("note", payload.note.trim()) : null,
      ...(payload.tags || "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
        .map((tag) => buildAnnotation("tag", tag)),
    ].filter(Boolean) as Annotation[];

    if (annotations.length === 0) {
      return NextResponse.json({ error: "Please add a note or a tag." }, { status: 400 });
    }

    const updated = await addAnnotation(imageId, annotations);
    if (!updated) {
      return NextResponse.json({ error: "Image not found." }, { status: 404 });
    }

    return NextResponse.json({ image: updated });
  } catch (error) {
    console.error("Failed to save annotation", error);
    return NextResponse.json({ error: "Unable to save the annotation." }, { status: 500 });
  }
}
