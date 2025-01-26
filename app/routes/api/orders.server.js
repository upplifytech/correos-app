import { json } from "@remix-run/node";
import { generarGuia } from "~/services/correos/guia.server";
import { Credentials } from "~/models/credentials.server";

export async function action({ request }) {
  const { shop, order } = await request.json();
  
  // Verificar existencia de credenciales
  const credentials = await Credentials.findOne({ shopId: shop });
  if (!credentials) {
    return json({ error: "Credenciales no configuradas" }, 401);
  }

  try {
    // Generar guía con datos de la orden
    const guia = await generarGuia(shop, {
      destino: order.shipping_address,
      peso: order.total_weight * 1000, // Convertir kg a gramos
      contenido: order.line_items.map(item => item.title).join(", ")
    });

    return json({ 
      success: true, 
      guia: guia.numeroGuia,
      pdf: guia.rawResponse // Aquí deberías procesar el PDF real
    });
    
  } catch (error) {
    return json({ 
      error: "Error generando guía",
      details: error.message 
    }, 500);
  }
}