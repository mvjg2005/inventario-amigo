/** Preferencias de foto/avatar de perfil (local al navegador, por usuario). */

export type AvatarChoice =
  | { type: "preset"; id: string }
  | { type: "custom"; dataUrl: string }
  | { type: "oauth"; url: string };

export interface StoredProfile {
  avatar: AvatarChoice | null;
  /** Nombre opcional mostrado en la UI (además del de Auth) */
  displayName?: string;
}

const STORAGE_PREFIX = "stockpyme_profile_";
export const PROFILE_CHANGED_EVENT = "stockpyme-profile-changed";

export type AuthLikeUser = {
  id?: string | null;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
} | null | undefined;

function storageKey(userId: string) {
  return `${STORAGE_PREFIX}${userId}`;
}

export function getDisplayName(user: AuthLikeUser): string {
  const meta = user?.user_metadata ?? {};
  const fromMeta =
    (meta.nombre as string | undefined) ||
    (meta.full_name as string | undefined) ||
    (meta.name as string | undefined);
  if (fromMeta?.trim()) return fromMeta.trim();
  if (user?.email) return user.email.split("@")[0] || user.email;
  return "Mi cuenta";
}

export function getInitials(user: AuthLikeUser): string {
  const name = getDisplayName(user);
  if (user?.email && name === user.email.split("@")[0]) {
    return name.slice(0, 2).toUpperCase();
  }
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "?";
}

export function getOAuthAvatarUrl(user: AuthLikeUser): string | null {
  const meta = user?.user_metadata ?? {};
  const url =
    (meta.avatar_url as string | undefined) ||
    (meta.picture as string | undefined) ||
    null;
  return url && typeof url === "string" ? url : null;
}

export function loadStoredProfile(userId: string | null | undefined): StoredProfile {
  if (!userId || typeof window === "undefined") return { avatar: null };
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return { avatar: null };
    const parsed = JSON.parse(raw) as StoredProfile;
    return {
      avatar: parsed.avatar ?? null,
      displayName: parsed.displayName,
    };
  } catch {
    return { avatar: null };
  }
}

export function saveStoredProfile(
  userId: string,
  profile: StoredProfile,
): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey(userId), JSON.stringify(profile));
  window.dispatchEvent(
    new CustomEvent(PROFILE_CHANGED_EVENT, { detail: { userId, profile } }),
  );
}

export function setAvatarChoice(userId: string, avatar: AvatarChoice | null) {
  const current = loadStoredProfile(userId);
  saveStoredProfile(userId, { ...current, avatar });
}

/** Resuelve la URL de imagen a mostrar (preset, custom u OAuth). */
export function resolveAvatarSrc(
  user: AuthLikeUser,
  stored?: StoredProfile | null,
): string | null {
  const profile = stored ?? loadStoredProfile(user?.id);
  const choice = profile.avatar;

  if (choice?.type === "preset") {
    const preset = CARTOON_AVATARS.find((a) => a.id === choice.id);
    return preset?.src ?? null;
  }
  if (choice?.type === "custom") return choice.dataUrl;
  if (choice?.type === "oauth") return choice.url;

  // Sin preferencia guardada: foto de Google/OAuth si existe
  return getOAuthAvatarUrl(user);
}

/** Comprime una imagen del usuario a un data URL razonable para localStorage. */
export function fileToAvatarDataUrl(file: File, maxSize = 192): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("El archivo debe ser una imagen"));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      reject(new Error("La imagen no puede superar 5 MB"));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("No se pudo leer la imagen"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Imagen no válida"));
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("No se pudo procesar la imagen"));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function svgDataUrl(svg: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** Caricaturas de caras (SVG) para elegir por defecto. */
export const CARTOON_AVATARS: { id: string; label: string; src: string }[] = [
  {
    id: "sunny",
    label: "Sol",
    src: svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <circle cx="40" cy="40" r="40" fill="#FBBF24"/>
  <circle cx="28" cy="34" r="4.5" fill="#1F2937"/>
  <circle cx="52" cy="34" r="4.5" fill="#1F2937"/>
  <path d="M26 48c4 8 24 8 28 0" fill="none" stroke="#1F2937" stroke-width="3.5" stroke-linecap="round"/>
  <circle cx="18" cy="42" r="5" fill="#F87171" opacity=".55"/>
  <circle cx="62" cy="42" r="5" fill="#F87171" opacity=".55"/>
</svg>`),
  },
  {
    id: "mint",
    label: "Menta",
    src: svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <circle cx="40" cy="40" r="40" fill="#34D399"/>
  <circle cx="28" cy="33" r="5" fill="#064E3B"/>
  <circle cx="52" cy="33" r="5" fill="#064E3B"/>
  <circle cx="30" cy="32" r="1.6" fill="#ECFDF5"/>
  <circle cx="54" cy="32" r="1.6" fill="#ECFDF5"/>
  <path d="M30 50c3 6 17 6 20 0" fill="none" stroke="#064E3B" stroke-width="3.5" stroke-linecap="round"/>
  <path d="M22 22c4-6 12-6 16 0" fill="none" stroke="#064E3B" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M42 22c4-6 12-6 16 0" fill="none" stroke="#064E3B" stroke-width="2.5" stroke-linecap="round"/>
</svg>`),
  },
  {
    id: "sky",
    label: "Cielo",
    src: svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <circle cx="40" cy="40" r="40" fill="#60A5FA"/>
  <ellipse cx="28" cy="34" rx="5" ry="6" fill="#1E3A8A"/>
  <ellipse cx="52" cy="34" rx="5" ry="6" fill="#1E3A8A"/>
  <path d="M28 50c4 7 20 7 24 0" fill="none" stroke="#1E3A8A" stroke-width="3.5" stroke-linecap="round"/>
  <rect x="18" y="18" width="44" height="10" rx="5" fill="#1E40AF"/>
  <rect x="30" y="12" width="20" height="10" rx="4" fill="#1E40AF"/>
</svg>`),
  },
  {
    id: "rose",
    label: "Rosa",
    src: svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <circle cx="40" cy="40" r="40" fill="#FB7185"/>
  <circle cx="28" cy="34" r="4" fill="#881337"/>
  <circle cx="52" cy="34" r="4" fill="#881337"/>
  <path d="M32 48c2 6 14 6 16 0" fill="none" stroke="#881337" stroke-width="3.2" stroke-linecap="round"/>
  <path d="M20 28c6-2 10 2 12 6" fill="none" stroke="#881337" stroke-width="2.2" stroke-linecap="round"/>
  <path d="M60 28c-6-2-10 2-12 6" fill="none" stroke="#881337" stroke-width="2.2" stroke-linecap="round"/>
  <circle cx="20" cy="44" r="4" fill="#FDA4AF"/>
  <circle cx="60" cy="44" r="4" fill="#FDA4AF"/>
</svg>`),
  },
  {
    id: "violet",
    label: "Violeta",
    src: svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <circle cx="40" cy="40" r="40" fill="#A78BFA"/>
  <path d="M22 34c0-4 4-7 8-7s8 3 8 7" fill="none" stroke="#4C1D95" stroke-width="3" stroke-linecap="round"/>
  <path d="M42 34c0-4 4-7 8-7s8 3 8 7" fill="none" stroke="#4C1D95" stroke-width="3" stroke-linecap="round"/>
  <circle cx="30" cy="36" r="3.5" fill="#4C1D95"/>
  <circle cx="50" cy="36" r="3.5" fill="#4C1D95"/>
  <ellipse cx="40" cy="52" rx="8" ry="5" fill="#4C1D95"/>
  <ellipse cx="40" cy="50" rx="6" ry="3" fill="#C4B5FD"/>
</svg>`),
  },
  {
    id: "orange",
    label: "Naranja",
    src: svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <circle cx="40" cy="40" r="40" fill="#FB923C"/>
  <circle cx="28" cy="34" r="4.5" fill="#7C2D12"/>
  <circle cx="52" cy="34" r="4.5" fill="#7C2D12"/>
  <path d="M24 46c6 10 26 10 32 0" fill="none" stroke="#7C2D12" stroke-width="3.5" stroke-linecap="round"/>
  <path d="M16 24c8 2 14 10 16 16" fill="none" stroke="#9A3412" stroke-width="3" stroke-linecap="round"/>
  <path d="M64 24c-8 2-14 10-16 16" fill="none" stroke="#9A3412" stroke-width="3" stroke-linecap="round"/>
</svg>`),
  },
  {
    id: "slate",
    label: "Pizarra",
    src: svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <circle cx="40" cy="40" r="40" fill="#94A3B8"/>
  <rect x="22" y="28" width="12" height="10" rx="3" fill="#0F172A"/>
  <rect x="46" y="28" width="12" height="10" rx="3" fill="#0F172A"/>
  <rect x="24" y="30" width="8" height="3" fill="#38BDF8"/>
  <rect x="48" y="30" width="8" height="3" fill="#38BDF8"/>
  <path d="M28 52h24" stroke="#0F172A" stroke-width="3.5" stroke-linecap="round"/>
  <path d="M20 18h40v10H20z" fill="#1E293B"/>
</svg>`),
  },
  {
    id: "coral",
    label: "Coral",
    src: svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <circle cx="40" cy="40" r="40" fill="#F472B6"/>
  <circle cx="28" cy="36" r="4" fill="#831843"/>
  <circle cx="52" cy="36" r="4" fill="#831843"/>
  <path d="M34 50c2 4 10 4 12 0" fill="none" stroke="#831843" stroke-width="3" stroke-linecap="round"/>
  <circle cx="40" cy="20" r="8" fill="#DB2777"/>
  <circle cx="28" cy="18" r="6" fill="#DB2777"/>
  <circle cx="52" cy="18" r="6" fill="#DB2777"/>
</svg>`),
  },
];
