import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { MediaError, getForServing, list, remove, setCover, updateAlt, upload } from "@/services/media";
import type { MediaViewer } from "@/services/media";
import { MAX_MEDIA_BYTES, MAX_MEDIA_PER_PROPERTY } from "@/validations/media";
import { seedMedia, seedProperty } from "./support/seed";
import { resetTestWorker, startTestWorker, type TestWorker } from "./support/worker";

const AGENT_A = { id: "user_agent_a", role: "agent" } as const;
const AGENT_B = { id: "user_agent_b", role: "agent" } as const;
const VIEWER = { id: "user_viewer", role: "viewer" } as const;
const ADMIN = { id: "user_admin", role: "admin" } as const;

/** Mirrors `ownerScope` in `lib/auth/guards.ts`: admins act on every owner's rows. */
function scopeOf(user: MediaViewer): string | null {
  return user !== null && user.role === "admin" ? null : (user?.id ?? null);
}

function file(name: string, type: string, bytes = 8): File {
  return new File([new Uint8Array(bytes)], name, { type });
}

async function errorCode(promise: Promise<unknown>): Promise<string> {
  const error = await promise.catch((thrown: unknown) => thrown);
  expect(error).toBeInstanceOf(MediaError);
  return (error as MediaError).code;
}

let worker: TestWorker;
let propertyId: string;

beforeAll(async () => {
  worker = await startTestWorker();
});

afterAll(async () => {
  await worker.dispose();
});

beforeEach(async () => {
  await resetTestWorker(worker);
  propertyId = await seedProperty(worker, { id: "property-a", ownerId: AGENT_A.id });
});

describe("upload", () => {
  it("stores the object and makes the first image the cover", async () => {
    const media = await upload(propertyId, scopeOf(AGENT_A), file("photo.png", "image/png", 70));

    expect(media).toMatchObject({
      propertyId,
      mimeType: "image/png",
      sizeBytes: 70,
      isCover: true,
      src: `/media/${media.id}`,
    });

    const object = await worker.r2.get(`properties/${propertyId}/media/${media.id}`);
    expect(object).not.toBeNull();
    if (!object) throw new Error("expected the uploaded object in R2");
    expect(object.httpMetadata?.contentType).toBe("image/png");
    expect(new Uint8Array(await object.arrayBuffer())).toHaveLength(70);
  });

  it("never gives the cover to a document, even when it is uploaded first", async () => {
    const document = await upload(propertyId, scopeOf(AGENT_A), file("deed.pdf", "application/pdf"));
    expect(document.isCover).toBe(false);

    const photo = await upload(propertyId, scopeOf(AGENT_A), file("photo.png", "image/png"));
    expect(photo.isCover).toBe(true);
  });

  it("keeps the cover on the first image when another is added", async () => {
    const first = await upload(propertyId, scopeOf(AGENT_A), file("one.png", "image/png"));
    const second = await upload(propertyId, scopeOf(AGENT_A), file("two.png", "image/png"));

    expect(first.isCover).toBe(true);
    expect(second.isCover).toBe(false);
    expect((await list(propertyId, scopeOf(AGENT_A))).map((item) => item.id)).toEqual([first.id, second.id]);
  });

  it("rejects an empty file, an unsupported type and a file over the size cap", async () => {
    expect(await errorCode(upload(propertyId, scopeOf(AGENT_A), file("empty.png", "image/png", 0)))).toBe(
      "empty_file",
    );
    expect(await errorCode(upload(propertyId, scopeOf(AGENT_A), file("notes.txt", "text/plain")))).toBe(
      "unsupported_type",
    );
    expect(
      await errorCode(upload(propertyId, scopeOf(AGENT_A), file("big.png", "image/png", MAX_MEDIA_BYTES + 1))),
    ).toBe("too_large");

    expect((await worker.r2.list({ prefix: `properties/${propertyId}/media/` })).objects).toEqual([]);
  });

  it("stops at the per-property file limit", async () => {
    for (let index = 0; index < MAX_MEDIA_PER_PROPERTY; index += 1) {
      await seedMedia(worker, { propertyId, uploadedAt: index });
    }

    expect(await errorCode(upload(propertyId, scopeOf(AGENT_A), file("extra.png", "image/png")))).toBe(
      "limit_reached",
    );
  });

  it("refuses a viewer and another agent, and stores nothing", async () => {
    expect(await errorCode(upload(propertyId, scopeOf(VIEWER), file("photo.png", "image/png")))).toBe(
      "not_found",
    );
    expect(await errorCode(upload(propertyId, scopeOf(AGENT_B), file("photo.png", "image/png")))).toBe(
      "not_found",
    );

    expect((await worker.r2.list({ prefix: "properties/" })).objects).toEqual([]);
    expect(await list(propertyId, scopeOf(AGENT_A))).toEqual([]);
  });

  it("lets an admin upload to any owner's property", async () => {
    const media = await upload(propertyId, scopeOf(ADMIN), file("photo.png", "image/png"));

    expect(media.propertyId).toBe(propertyId);
    expect(await list(propertyId, scopeOf(AGENT_A))).toHaveLength(1);
  });
});

describe("setCover ownership (IDOR)", () => {
  let coverId: string;
  let otherId: string;

  beforeEach(async () => {
    coverId = await seedMedia(worker, { propertyId, isCover: true, uploadedAt: 1_000 });
    otherId = await seedMedia(worker, { propertyId, isCover: false, uploadedAt: 2_000 });
  });

  it("moves the cover and keeps a single cover row", async () => {
    expect(await setCover(otherId, scopeOf(AGENT_A))).toBe(propertyId);

    const items = await list(propertyId, scopeOf(AGENT_A));
    expect(items[0]?.id).toBe(otherId);
    expect(items.filter((item) => item.isCover).map((item) => item.id)).toEqual([otherId]);
    expect(items.find((item) => item.id === coverId)?.isCover).toBe(false);
  });

  it("is a no-op when the file is already the cover", async () => {
    expect(await setCover(coverId, scopeOf(AGENT_A))).toBe(propertyId);
    expect((await list(propertyId, scopeOf(AGENT_A))).filter((item) => item.isCover)).toHaveLength(1);
  });

  it("rejects a document as a cover", async () => {
    const documentId = await seedMedia(worker, { propertyId, mimeType: "application/pdf" });

    expect(await errorCode(setCover(documentId, scopeOf(AGENT_A)))).toBe("not_an_image");
    expect((await list(propertyId, scopeOf(AGENT_A)))[0]?.id).toBe(coverId);
  });

  it("refuses a viewer and another agent, leaving the cover alone", async () => {
    expect(await errorCode(setCover(otherId, scopeOf(VIEWER)))).toBe("not_found");
    expect(await errorCode(setCover(otherId, scopeOf(AGENT_B)))).toBe("not_found");

    const items = await list(propertyId, scopeOf(AGENT_A));
    expect(items.find((item) => item.isCover)?.id).toBe(coverId);
  });

  it("lets an admin set the cover on any owner's property", async () => {
    expect(await setCover(otherId, scopeOf(ADMIN))).toBe(propertyId);
    expect((await list(propertyId, scopeOf(AGENT_A)))[0]?.id).toBe(otherId);
  });
});

describe("updateAlt", () => {
  it("stores trimmed text and clears an emptied value to null", async () => {
    const mediaId = await seedMedia(worker, { propertyId, altText: null });

    expect((await updateAlt(mediaId, scopeOf(AGENT_A), "Front porch")).altText).toBe("Front porch");
    expect((await updateAlt(mediaId, scopeOf(AGENT_A), "")).altText).toBeNull();
  });

  it("refuses a viewer and another agent", async () => {
    const mediaId = await seedMedia(worker, { propertyId, altText: "Original" });

    expect(await errorCode(updateAlt(mediaId, scopeOf(VIEWER), "Changed"))).toBe("not_found");
    expect(await errorCode(updateAlt(mediaId, scopeOf(AGENT_B), "Changed"))).toBe("not_found");
    expect((await list(propertyId, scopeOf(AGENT_A)))[0]?.altText).toBe("Original");
  });
});

describe("remove ownership (IDOR)", () => {
  it("deletes the row and the object, promoting the next photo", async () => {
    const first = await upload(propertyId, scopeOf(AGENT_A), file("one.png", "image/png"));
    await upload(propertyId, scopeOf(AGENT_A), file("deed.pdf", "application/pdf"));
    const second = await upload(propertyId, scopeOf(AGENT_A), file("two.png", "image/png"));

    expect(await remove(first.id, scopeOf(AGENT_A))).toBe(propertyId);

    expect(await worker.r2.get(`properties/${propertyId}/media/${first.id}`)).toBeNull();
    const items = await list(propertyId, scopeOf(AGENT_A));
    expect(items.filter((item) => item.isCover).map((item) => item.id)).toEqual([second.id]);
    expect(items.map((item) => item.mimeType)).toEqual(["image/png", "application/pdf"]);
  });

  it("refuses a viewer and another agent, leaving row and object in place", async () => {
    const media = await upload(propertyId, scopeOf(AGENT_A), file("one.png", "image/png"));

    expect(await errorCode(remove(media.id, scopeOf(VIEWER)))).toBe("not_found");
    expect(await errorCode(remove(media.id, scopeOf(AGENT_B)))).toBe("not_found");

    expect(await list(propertyId, scopeOf(AGENT_A))).toHaveLength(1);
    expect(await worker.r2.get(`properties/${propertyId}/media/${media.id}`)).not.toBeNull();
  });

  it("lets an admin delete any owner's media", async () => {
    const media = await upload(propertyId, scopeOf(AGENT_A), file("one.png", "image/png"));

    expect(await remove(media.id, scopeOf(ADMIN))).toBe(propertyId);
    expect(await list(propertyId, scopeOf(AGENT_A))).toEqual([]);
  });
});

describe("list", () => {
  it("puts the cover first, then the oldest upload", async () => {
    const oldest = await seedMedia(worker, { propertyId, uploadedAt: 1_000 });
    const cover = await seedMedia(worker, { propertyId, isCover: true, uploadedAt: 2_000 });

    expect((await list(propertyId, scopeOf(AGENT_A))).map((item) => item.id)).toEqual([cover, oldest]);
  });

  it("returns nothing for a viewer, another agent or an unknown property", async () => {
    await seedMedia(worker, { propertyId });

    expect(await list(propertyId, scopeOf(VIEWER))).toEqual([]);
    expect(await list(propertyId, scopeOf(AGENT_B))).toEqual([]);
    expect(await list("missing-id", scopeOf(ADMIN))).toEqual([]);
  });
});

describe("getForServing visibility", () => {
  it("serves media of an active listing to anyone without resolving a viewer", async () => {
    const mediaId = await seedMedia(worker, { propertyId });
    const resolveViewer = vi.fn(async () => null);

    expect(await getForServing(mediaId, resolveViewer)).toEqual({
      r2Key: `properties/${propertyId}/media/${mediaId}`,
      isPublic: true,
    });
    expect(resolveViewer).not.toHaveBeenCalled();
  });

  it("serves a draft's media to its owner and to admins only", async () => {
    await worker.db.prepare("UPDATE properties SET status = 'draft' WHERE id = ?").bind(propertyId).run();
    const mediaId = await seedMedia(worker, { propertyId });

    expect(await getForServing(mediaId, async () => null)).toBeNull();
    expect(await getForServing(mediaId, async () => VIEWER)).toBeNull();
    expect(await getForServing(mediaId, async () => AGENT_B)).toBeNull();

    expect(await getForServing(mediaId, async () => AGENT_A)).toEqual({
      r2Key: `properties/${propertyId}/media/${mediaId}`,
      isPublic: false,
    });
    expect(await getForServing(mediaId, async () => ADMIN)).toEqual({
      r2Key: `properties/${propertyId}/media/${mediaId}`,
      isPublic: false,
    });
  });

  it("returns nothing for an unknown media id", async () => {
    expect(await getForServing("missing-id", async () => ADMIN)).toBeNull();
  });
});
