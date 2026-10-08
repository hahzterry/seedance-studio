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

  const contentType = typeof body?.contentType === "string" ? body.contentType : null;
  const size = typeof body?.size === "number" ? body.size : null;

  if (!contentType || size === null) {
    return NextResponse.json({ error: "Missing contentType or size" }, { status: 400 });
  }
  if (!isAllowedUploadType(contentType)) {
    return NextResponse.json({ error: `Unsupported file type: ${contentType}` }, { status: 415 });
  }
  if (size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "File is larger than 200 MB" }, { status: 413 });
  }

  try {
    // Get a presigned upload URL from Higgsfield.
    // Higgsfield returns: { public_url, upload_url, content_type, upload_headers }
    const target = await getHiggsfield().generateUploadUrl(contentType);

    return NextResponse.json({
      uploadUrl: target.upload_url,
      fileUrl: target.public_url,
      uploadHeaders: target.upload_headers,
    });
  } catch (err) {
    console.warn(`[uploads/presign] failed for ${contentType}:`, err);
    const { httpStatus, message } = describeError(err);
    return NextResponse.json({ error: message }, { status: httpStatus });
  }
}
