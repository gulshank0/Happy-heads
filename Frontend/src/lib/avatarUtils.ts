// Avatar and image URL utilities
import { BACKEND_URL } from "../config/api";

export const getAvatarUrl = (
  avatar: string | null | undefined,
): string | null => {
  if (!avatar) return null;

  // If it's already a full URL (Google avatar or external), return as is
  if (avatar.startsWith("http://") || avatar.startsWith("https://")) {
    return avatar;
  }

  // If it's a relative path (uploaded avatar), construct full URL
  if (avatar.startsWith("/uploads/")) {
    return `${BACKEND_URL}${avatar}`;
  }

  return avatar;
};

export const isCustomAvatar = (avatar: string | null | undefined): boolean => {
  if (!avatar) return false;
  return avatar.includes("/uploads/avatars/");
};

export const isGoogleAvatar = (avatar: string | null | undefined): boolean => {
  if (!avatar) return false;
  return (
    avatar.includes("googleusercontent.com") ||
    avatar.includes("lh3.googleusercontent.com")
  );
};

// Cache management for avatars
export const clearAvatarCache = () => {
  // Clear browser cache for avatars
  if ("caches" in window) {
    caches.keys().then((names) => {
      names.forEach((name) => {
        if (name.includes("avatar") || name.includes("image")) {
          caches.delete(name);
        }
      });
    });
  }
};
