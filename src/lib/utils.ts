import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMoney(amountBs: number): string {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("stockpyme_empresa");
    if (saved) {
      try {
        const empresa = JSON.parse(saved);
        if (empresa.moneda === "USD") {
          return `$${(amountBs / 6.96).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
      } catch (e) {
        console.error(e);
      }
    }
  }
  return `Bs ${amountBs.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function getCurrencyLabel(): string {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("stockpyme_empresa");
    if (saved) {
      try {
        const empresa = JSON.parse(saved);
        if (empresa.moneda === "USD") {
          return "USD";
        }
      } catch (e) {
        console.error(e);
      }
    }
  }
  return "Bs";
}
