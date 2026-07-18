/** Preferencias del sistema (localStorage). */

export type SystemPrefs = {
  /** Mostrar campana / panel de alertas de stock bajo */
  alertasBajoInventario: boolean;
  /**
   * Si es true, el asistente IA muestra la tarjeta y pide confirmar
   * antes de registrar entradas/salidas.
   * Si es false, registra al instante cuando los datos son suficientes.
   */
  validacionMovimientos: boolean;
};

export const DEFAULT_SYSTEM_PREFS: SystemPrefs = {
  alertasBajoInventario: true,
  validacionMovimientos: true,
};

const STORAGE_KEY = "stockpyme_prefs";

export function loadSystemPrefs(): SystemPrefs {
  if (typeof window === "undefined") return { ...DEFAULT_SYSTEM_PREFS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SYSTEM_PREFS };
    const parsed = JSON.parse(raw) as Partial<SystemPrefs>;
    return {
      alertasBajoInventario:
        typeof parsed.alertasBajoInventario === "boolean"
          ? parsed.alertasBajoInventario
          : DEFAULT_SYSTEM_PREFS.alertasBajoInventario,
      validacionMovimientos:
        typeof parsed.validacionMovimientos === "boolean"
          ? parsed.validacionMovimientos
          : DEFAULT_SYSTEM_PREFS.validacionMovimientos,
    };
  } catch {
    return { ...DEFAULT_SYSTEM_PREFS };
  }
}

export function saveSystemPrefs(prefs: SystemPrefs) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  window.dispatchEvent(new CustomEvent("stockpyme-prefs-changed", { detail: prefs }));
}
