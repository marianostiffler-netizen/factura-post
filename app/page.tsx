import { redirect } from "next/navigation";

/**
 * La raíz redirige al Dashboard, que funciona como pantalla principal
 * mientras el login está deshabilitado.
 */
export default function HomePage() {
  redirect("/dashboard");
}
