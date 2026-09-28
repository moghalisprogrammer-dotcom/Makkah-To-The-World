import { NextResponse } from "next/server";
import { ZodError } from "zod";
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function json(value: unknown, status = 200) {
  return NextResponse.json(value, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
export function failure(error: unknown) {
  if (error instanceof HttpError)
    return json({ error: error.message }, error.status);
  if (error instanceof ZodError)
    return json(
      { error: error.issues[0]?.message || "يرجى مراجعة البيانات." },
      400,
    );
  console.error(
    "Request failed",
    error instanceof Error ? error.message : "Unknown error",
  );
  return json(
    { error: "تعذر إتمام العملية حاليًا. يرجى المحاولة مرة أخرى." },
    503,
  );
}
export function checkOrigin(request: Request) {
  const allowed = new URL(process.env.APP_URL || "http://localhost:3000")
    .origin;
  if (request.headers.get("origin") !== allowed)
    throw new HttpError(403, "مصدر الطلب غير مسموح.");
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new HttpError(415, "نوع الطلب غير مدعوم.");
}
export async function body(request: Request) {
  checkOrigin(request);
  if (Number(request.headers.get("content-length") || 0) > 8192)
    throw new HttpError(413, "حجم الطلب كبير.");
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "الطلب فارغ.");
  let size = 0;
  const chunks: Uint8Array[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 8192) {
      await reader.cancel();
      throw new HttpError(413, "حجم الطلب كبير.");
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new HttpError(400, "صيغة الطلب غير صحيحة.");
  }
}
