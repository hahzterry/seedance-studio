import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, sessionSecret, verifySession } from "@/lib/auth";
import { describeError, getHiggsfield } from "@/lib/higgsfield";
import { MAX_UPLOAD_BYTES, isAllowedUploadType } from "@/lib/modes";

export async function POST(request: NextRequest) {
  // Same auth check as /api/uploads
  if (!verifySession(request.cookies.get(SESSION_COOKIE)?.value, sessionSecret())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { filename?: unknown; contentType?: unknown; size?: unknown }
    | null;

  const filename = typeof body?.filename === "string" ? body.filename : null;
  const contentType = typeof body?.contentType === "string" ? body.contentType : null;
  const size = typeof body?.size === "number" ? body.size : null;

  if (!filename || !contentType || size === null) {
    return NextResponse.json({ error: "Missing filename, contentType or size" }, { status: 400 });
  }
  if (!isAllowedUploadType(contentType)) {
    return NextResponse.json({ error: `Unsupported file type: ${contentType}` }, { status: 415 });
  }
  if (size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "File is larger than 200 MB" }, { status: 413 });
  }

  try {
    // ⚠️ THIS LINE DEPENDS ON YOUR HIGGSFIELD SDK.
    // The Higgsfield SDK likely exposes something like one of these:
    //   getHiggsfield().createUpload({ filename, contentType, size })
    //   getHiggsfield().files.createUpload(...)
    //   getHiggsfield().getUploadUrl(...)
    // It should return { uploadUrl, fileUrl } (or equivalent).
    const { uploadUrl, fileUrl } = await getHiggsfield().createPresignedUpload({
      filename,
      contentType,
      size,
    });

    return NextResponse.json({ uploadUrl, fileUrl });
  } catch (err) {
    console.warn(`[uploads/presign] failed for ${filename}:`, err);
    const { httpStatus, message } = describeError(err);
    return NextResponse.json({ error: message }, { status: httpStatus });
  }
}
