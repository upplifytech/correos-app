import { json } from "@remix-run/node";
import { trackEnvio } from "~/services/correos/tracking.server";

export async function loader({ params, request }) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  
  try {
    const trackingInfo = await trackEnvio(shop, params.guia);
    return json({ 
      tracking: {
        estado: trackingInfo.Estado,
        fecha: trackingInfo.FechaHora,
        ubicacion: trackingInfo.Unidad
      } 
    });
  } catch (error) {
    return json({ error: "Error obteniendo tracking" }, 500);
  }
}