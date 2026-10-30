export {};

declare global {
  /**
   * The session token is customized with `metadata: {{user.public_metadata}}`
   * (see context/library-docs.md), so `sessionClaims.metadata` is the user's
   * public metadata. `role` is the only key this app reads.
   */
  interface CustomJwtSessionClaims {
    metadata?: {
      role?: unknown;
    };
  }
}
