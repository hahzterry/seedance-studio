import { MAX_UPLOAD_BYTES, UPLOAD_TYPES, type MediaKind } from "./modes";

export function kindOf(contentType: string): MediaKind | null {
  for (const [kind, types] of Object.entries(UPLOAD_TYPES)) {
    if ((types as readonly string[]).includes(contentType)) return kind as MediaKind;
  }
  return null;
}

export function acceptFor(kinds: MediaKind[]): string {
  return kinds.flatMap((k) => UPLOAD_TYPES[k]).join(",");
}

/**
 * Uploads a file directly to Higgsfield storage using a presigned URL.
 * The file never touches our Vercel backend, so the 4.5MB limit doesn't apply.
 * 
 * NOTE: The `_range` parameter is currently ignored. Trimming is disabled
 * until we can implement it client-side (or find a presigned-trim workflow).
 */
export async function uploadMedia(file: File, _range?: unknown): Promise<string> {
  if (file.size > MAX_UPLOAD_BYTES) throw new Error(`${file.name} is larger than 200 MB`);

  // 1. Get a presigned URL from our backend
  const presignRes = await fetch("/api/uploads/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
      size: file.size,
    }),
  });

  if (!presignRes.ok) {
    const { error } = await presignRes.json().catch(() => ({ error: "Presign failed" }));
    throw new Error(error);
  }

  const { uploadUrl, fileUrl } = (await presignRes.json()) as {
    uploadUrl: string;
    fileUrl: string;
  };

  // 2. PUT the file directly to Higgsfield storage
  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });

  if (!putRes.ok) {
    throw new Error(`Upload to Higgsfield failed: ${putRes.status}`);
  }

  return fileUrl;
}
