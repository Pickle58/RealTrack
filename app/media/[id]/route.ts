import { getOptionalUser } from "@/lib/auth/current-user";
import { getMedia } from "@/lib/r2";
import { getForServing } from "@/services/media";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function notFound(): Response {
  return new Response("Not found", { status: 404 });
}

/** Active parents are public; everything else is owner/admin only and never cached by a proxy. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  if (!UUID.test(id)) return notFound();

  // A D1 outage must not surface as an unhandled error on an <img> request: report it as
  // temporarily unavailable, which the UI already renders as the photo placeholder.
  let target: Awaited<ReturnType<typeof getForServing>>;
  try {
    target = await getForServing(id, getOptionalUser);
  } catch (error) {
    console.error("[media/route] lookup failed", error);
    return new Response("Media is unavailable", { status: 503 });
  }
  if (!target) return notFound();

  let object: R2ObjectBody | null;
  try {
    object = await getMedia(target.r2Key);
  } catch (error) {
    console.error("[media/route] R2 read failed", error);
    return new Response("Media is unavailable", { status: 503 });
  }
  if (!object) return notFound();

  const headers = new Headers({
    "Content-Type": object.httpMetadata?.contentType ?? "application/octet-stream",
    "Cache-Control": target.isPublic ? "public, max-age=3600" : "private, no-store",
    "X-Content-Type-Options": "nosniff",
  });

  return new Response(object.body, { headers });
}
