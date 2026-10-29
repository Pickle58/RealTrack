export type MediaItem = {
  id: string;
  propertyId: string;
  /** Always the app's own media route; R2 keys never reach the client. */
  src: string;
  mimeType: string;
  sizeBytes: number;
  altText: string | null;
  isCover: boolean;
  uploadedAt: number;
};
