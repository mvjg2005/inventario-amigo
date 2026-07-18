import { useEffect, useRef, useState } from "react";
import { Camera, Check, ImagePlus, LogOut, User as UserIcon } from "lucide-react";
import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logoutFn } from "@/lib/auth.server";
import { cn } from "@/lib/utils";
import {
  CARTOON_AVATARS,
  PROFILE_CHANGED_EVENT,
  fileToAvatarDataUrl,
  getDisplayName,
  getInitials,
  loadStoredProfile,
  resolveAvatarSrc,
  setAvatarChoice,
  type AuthLikeUser,
} from "@/lib/userProfile";

interface UserMenuProps {
  user: AuthLikeUser;
  /** Tamaño del círculo en el header */
  size?: "sm" | "md" | "lg";
  className?: string;
}

const AVATAR_SIZE: Record<"sm" | "md" | "lg", string> = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-16 w-16",
};

export function UserAvatarFace({
  user,
  className,
  size = "sm",
}: {
  user: AuthLikeUser;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setSrc(resolveAvatarSrc(user));
  }, [user, tick]);

  useEffect(() => {
    const onChange = () => setTick((t) => t + 1);
    window.addEventListener(PROFILE_CHANGED_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(PROFILE_CHANGED_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  return (
    <Avatar className={cn(AVATAR_SIZE[size], className)}>
      {src ? <AvatarImage src={src} alt={getDisplayName(user)} /> : null}
      <AvatarFallback
        className={cn(
          "bg-primary text-primary-foreground font-semibold",
          size === "lg" ? "text-base" : "text-xs",
        )}
      >
        {getInitials(user)}
      </AvatarFallback>
    </Avatar>
  );
}

export function UserMenu({ user, size = "sm", className }: UserMenuProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const displayName = getDisplayName(user);
  const email = user?.email ?? "Sin correo";
  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;
    const stored = loadStoredProfile(userId);
    if (stored.avatar?.type === "preset") {
      setSelectedPreset(stored.avatar.id);
    } else {
      setSelectedPreset(null);
    }
  }, [userId, pickerOpen]);

  const handleLogout = async () => {
    await logoutFn();
    router.invalidate();
  };

  const applyPreset = (id: string) => {
    if (!userId) return;
    setAvatarChoice(userId, { type: "preset", id });
    setSelectedPreset(id);
    toast.success("Avatar actualizado");
  };

  const handleUpload = async (file: File | undefined) => {
    if (!file || !userId) return;
    setBusy(true);
    try {
      const dataUrl = await fileToAvatarDataUrl(file);
      setAvatarChoice(userId, { type: "custom", dataUrl });
      setSelectedPreset(null);
      toast.success("Foto de perfil guardada");
      setPickerOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo subir la foto");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const clearCustom = () => {
    if (!userId) return;
    setAvatarChoice(userId, null);
    setSelectedPreset(null);
    toast.success("Se restauró el avatar por defecto");
  };

  if (!user) {
    return (
      <Avatar className={size === "md" ? "h-10 w-10" : "h-8 w-8"}>
        <AvatarFallback className="bg-muted text-muted-foreground">
          <UserIcon className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              "rounded-full outline-none ring-offset-background transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              className,
            )}
            aria-label={`Cuenta de ${email}`}
            title={email}
          >
            <UserAvatarFace user={user} size={size} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuLabel className="font-normal">
            <div className="flex items-center gap-3 py-1">
              <UserAvatarFace user={user} size="md" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
                <p className="truncate text-xs text-muted-foreground" title={email}>
                  {email}
                </p>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setPickerOpen(true)}
            className="cursor-pointer gap-2"
          >
            <Camera className="h-4 w-4" />
            Cambiar foto de perfil
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => router.navigate({ to: "/configuracion" })}
            className="cursor-pointer gap-2"
          >
            <UserIcon className="h-4 w-4" />
            Ver perfil / configuración
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleLogout}
            className="cursor-pointer gap-2 text-rose-600 focus:text-rose-600"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Foto de perfil</DialogTitle>
            <DialogDescription>
              Elige una caricatura o sube tu propia foto. Se mostrará en el círculo de tu cuenta
              ({email}).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-medium">Caricaturas</p>
              <div className="grid grid-cols-4 gap-2">
                {CARTOON_AVATARS.map((avatar) => {
                  const active = selectedPreset === avatar.id;
                  return (
                    <button
                      key={avatar.id}
                      type="button"
                      onClick={() => applyPreset(avatar.id)}
                      className={cn(
                        "relative flex flex-col items-center gap-1 rounded-lg border p-2 transition-colors hover:bg-muted/60",
                        active
                          ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                          : "border-border",
                      )}
                      title={avatar.label}
                    >
                      <img
                        src={avatar.src}
                        alt={avatar.label}
                        className="h-12 w-12 rounded-full"
                      />
                      <span className="text-[10px] text-muted-foreground">{avatar.label}</span>
                      {active && (
                        <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Tu propia foto</p>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={(e) => handleUpload(e.target.files?.[0])}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  disabled={busy || !userId}
                  onClick={() => fileRef.current?.click()}
                >
                  <ImagePlus className="h-4 w-4" />
                  {busy ? "Procesando…" : "Subir imagen"}
                </Button>
                <Button type="button" variant="ghost" onClick={clearCustom}>
                  Quitar / por defecto
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                PNG, JPG o WebP. Se guarda en este navegador (máx. 5 MB).
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
