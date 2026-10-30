import { getById } from "@/services/properties";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;

  let detail: Awaited<ReturnType<typeof getById>>;
  try {
    detail = await getById(id, null);
  } catch (error) {
    // Reported without detail: the failure table keeps raw query/binding errors off the wire.
    console.error(
      "[app/api/properties/[id]/GET]",
      error instanceof Error ? error.name : "UnknownError",
    );
    return Response.json(
      { success: false, error: "Properties are temporarily unavailable" },
      { status: 503 },
    );
  }

  if (!detail) {
    return Response.json({ success: false, error: "Property not found" }, { status: 404 });
  }

  return Response.json({ success: true, data: detail });
}
