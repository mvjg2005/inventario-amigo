import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getBrowserSupabase, getOAuthRedirectUrl } from "@/lib/supabase-browser";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

type GoogleAuthButtonProps = {
  disabled?: boolean;
  onError?: (message: string) => void;
  onBusyChange?: (busy: boolean) => void;
  label?: string;
};

export function GoogleAuthButton({
  disabled,
  onError,
  onBusyChange,
  label = "Continuar con Google",
}: GoogleAuthButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    onBusyChange?.(true);
    onError?.("");

    try {
      const client = getBrowserSupabase();
      // skipBrowserRedirect: guardamos el code_verifier en localStorage
      // y redirigimos nosotros, para no perder el PKCE a mitad de camino.
      const { data, error } = await client.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: getOAuthRedirectUrl(),
          skipBrowserRedirect: true,
          queryParams: {
            access_type: "offline",
            prompt: "select_account",
          },
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.assign(data.url);
        return;
      }

      throw new Error("No se pudo iniciar el login con Google.");
    } catch (err: any) {
      const message =
        err?.message ||
        "No se pudo conectar con Google. Revisa la configuración en Supabase.";
      onError?.(message);
      setLoading(false);
      onBusyChange?.(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full border-border/80 bg-white hover:bg-slate-50"
      disabled={disabled || loading}
      onClick={handleGoogleLogin}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Redirigiendo a Google…
        </>
      ) : (
        <>
          <GoogleIcon className="mr-2 h-4 w-4" />
          {label}
        </>
      )}
    </Button>
  );
}
