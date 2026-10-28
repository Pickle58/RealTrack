import { getById } from "@/services/properties";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  const detail = await getById(id, null);

  if (!detail) {
    return Response.json({ success: false, error: "Property not found" }, { status: 404 });
  }

  return Response.json({ success: true, data: detail });
}
