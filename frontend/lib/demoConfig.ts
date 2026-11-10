// Explicit demo flag. Default OFF, and never active in a production build.
export const DEMO_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_DEMO_PRODUCTS === "true" &&
  process.env.NODE_ENV === "development";
