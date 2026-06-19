/**
 * Wrapper para logoutFn
 * Permite que componentes de cliente llamen al logout sin violar las restricciones de import
 */
// @ts-ignore
import { logoutFn as serverLogout } from "@/lib/auth.server";

export async function handleLogout() {
  return serverLogout();
}
