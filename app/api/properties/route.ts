import { search } from "@/services/properties";
import { parsePropertySearch } from "@/validations/property-search";

export async function GET(request: Request): Promise<Response> {
  const raw = Object.fromEntries(new URL(request.url).searchParams);

  try {
    const data = await search(parsePropertySearch(raw), null);
    return Response.json({ success: true, data });
  } catch (error) {
    // Reported without detail: the failure table keeps raw query/binding errors off the wire.
    console.error("[app/api/properties/GET]", error);
    return Response.json(
      { success: false, error: "Properties are temporarily unavailable" },
      { status: 503 },
    );
  }
}
