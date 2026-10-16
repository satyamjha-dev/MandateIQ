import { NextRequest, NextResponse } from "next/server";
import { processUploadedFile } from "@/lib/import/process-file";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json(
        { success: false, error: "No file provided. Please attach a statement file." },
        { status: 400 }
      );
    }

    const blob = file as File;
    const arrayBuffer = await blob.arrayBuffer();

    const draft = await processUploadedFile({
      filename: blob.name,
      mimeType: blob.type,
      buffer: arrayBuffer,
    });

    return NextResponse.json({
      success: true,
      draft,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to parse statement.";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

