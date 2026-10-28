import { search } from "@/services/properties";
import { parsePropertySearch } from "@/validations/property-search";

export async function GET(request: Request): Promise<Response> {
  const raw = Object.fromEntries(new URL(request.url).searchParams);
  const data = await search(parsePropertySearch(raw), null);

  return Response.json({ success: true, data });
}
