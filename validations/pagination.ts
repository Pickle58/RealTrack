import { z } from "zod";

export const MAX_PAGE = 1000;

/** `?page=` from a URL: junk, zero and out-of-range values fall back to the first page. */
export const pageParamSchema = z.coerce.number().int().min(1).max(MAX_PAGE).catch(1);
