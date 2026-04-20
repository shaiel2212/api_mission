/**
 * מדיה לפרויקטים: תמונות URL תקינות לעומת YouTube / קבצי וידאו.
 * ה-Hero משתמש בלוגיקת YouTube נפרדת; כרטיסים וגלריה חייבים URL שמתאים ל-<img>.
 */

export const defaultProjectStillImage =
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2075&q=80";

const supportedVideoExtensions = [".mp4", ".webm", ".ogg", ".mov"] as const;

export function isDirectVideoAsset(url: string): boolean {
  const normalized = url.split("?")[0].toLowerCase();
  return supportedVideoExtensions.some((extension) => normalized.endsWith(extension));
}

export function getYouTubeVideoId(url: string): string | null {
  const trimmed = url.trim();

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.toLowerCase();

    if (host === "youtu.be") {
      const id = parsed.pathname.replace(/^\//, "").split("/")[0]?.trim();
      return id || null;
    }

    if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
      const v = parsed.searchParams.get("v")?.trim();
      if (v) {
        return v;
      }

      const pathParts = parsed.pathname.split("/").filter(Boolean);
      const first = pathParts[0]?.toLowerCase();

      if (first === "embed" || first === "v" || first === "shorts" || first === "live") {
        const id = pathParts[1]?.trim();
        return id || null;
      }
    }
  } catch {
    return null;
  }

  return null;
}

/** ל-Hero — autoplay + mute (כמו ב-HomePage) */
export function getYouTubeEmbedSrc(url: string, origin?: string): string | null {
  const videoId = getYouTubeVideoId(url);
  if (!videoId) {
    return null;
  }

  const params = new URLSearchParams({
    autoplay: "1",
    mute: "1",
    playsinline: "1",
    controls: "0",
    rel: "0",
    modestbranding: "1",
    enablejsapi: "1",
  });

  if (origin) {
    params.set("origin", origin);
  }

  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

/** לגלריה / מודאל — בלי autoplay */
export function getYouTubeEmbedSrcGallery(videoId: string): string {
  const params = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
  });
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}

export function isDisplayableStillImageUrl(url: string | null | undefined): boolean {
  if (!url?.trim()) {
    return false;
  }
  if (isDirectVideoAsset(url)) {
    return false;
  }
  if (getYouTubeVideoId(url)) {
    return false;
  }
  return true;
}

export function pickFirstStillImage(
  candidates: (string | null | undefined)[],
  fallback: string = defaultProjectStillImage
): string {
  for (const c of candidates) {
    if (isDisplayableStillImageUrl(c)) {
      return c!.trim();
    }
  }
  return fallback;
}

/** תמונה לכרטיס בגריד / כרטיסי שירות בדף הבית */
export function pickProjectCoverImage(project: {
  image: string;
  modalImage: string;
  beforeImage: string;
  afterImage: string;
}): string {
  return pickFirstStillImage(
    [project.image, project.modalImage, project.beforeImage, project.afterImage],
    defaultProjectStillImage
  );
}
