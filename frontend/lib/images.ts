export const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80";

// Helper cerdas pemisah foto agar Base64 tidak terpotong koma bawaan
export const parseImages = (urlStr?: string): string[] => {
  if (!urlStr) return [FALLBACK_IMAGE];
  if (urlStr.includes("|||")) {
    return urlStr.split("|||").map((s) => s.trim()).filter(Boolean);
  }
  if (urlStr.startsWith("data:image")) {
    const regex = /(data:image\/[a-zA-Z0-9+.-]+;base64,[A-Za-z0-9+/=]+|https?:\/\/[^\s,]+)/g;
    const matches = urlStr.match(regex);
    if (matches && matches.length > 0) return matches;
    return [urlStr];
  }
  if (urlStr.includes(",")) {
    return urlStr.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [urlStr];
};
