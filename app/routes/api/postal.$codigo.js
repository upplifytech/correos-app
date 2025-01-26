import { json } from "@remix-run/node";
import { validarCodigoPostal } from "~/services/postalService.server";

export async function loader({ params }) {
  const resultado = await validarCodigoPostal(params.codigo);
  return json(resultado);
}