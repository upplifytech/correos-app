// app/routes/api/shipments.server.js
import { json } from "@remix-run/node";
import { generarGuia } from "~/services/correos/guia.server";
import { Credentials } from "~/models/credentials.server";
import { Envio } from "~/models/envios.server";
import { validarCodigoPostal } from "~/services/postalService.server";
import { authenticate } from "~/shopify.server";

export async function action({ request }) {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const shop = formData.get("shop");
  const orderId = formData.get("orderId");
  
  try {
    // 1. Validar credenciales de Correos
    const credentials = await Credentials.findOne({ shopId: shop });
    if (!credentials) {
      return json(
        { error: "Credenciales de Correos no configuradas" },
        { status: 401 }
      );
    }

    // 2. Obtener datos de la orden de Shopify
    const orden = await obtenerOrdenShopify(admin, orderId);
    
    // 3. Validar código postal
    const validacionPostal = await validarCodigoPostal(orden.shippingAddress.zip);
    if (!validacionPostal.valido) {
      return json(
        { 
          error: "Código postal inválido",
          detalles: validacionPostal.error 
        },
        { status: 400 }
      );
    }

    // 4. Generar guía con Correos
    const guiaData = await generarGuia(shop, {
      nombreDestinatario: `${orden.shippingAddress.firstName} ${orden.shippingAddress.lastName}`,
      direccion: orden.shippingAddress.address1,
      ciudad: orden.shippingAddress.city,
      provincia: validacionPostal.datos.provincia.codigo,
      canton: validacionPostal.datos.canton.codigo,
      peso: orden.pesoTotal,
      contenido: orden.lineItems.map(item => item.title).join(", ")
    });

    // 5. Actualizar orden en Shopify
    await actualizarOrdenShopify(admin, orderId, {
      trackingNumber: guiaData.numeroGuia,
      trackingUrl: `https://www.correos.go.cr/rastreo`
    });

    // 6. Guardar envío en base de datos
    const nuevoEnvio = await Envio.create({
      shopId: shop,
      orderId,
      guia: guiaData.numeroGuia,
      estado: "generada",
      pdf: guiaData.pdf,
      direccion: {
        postalCode: orden.shippingAddress.zip,
        provincia: validacionPostal.datos.provincia.nombre,
        canton: validacionPostal.datos.canton.nombre,
        distrito: validacionPostal.datos.distrito.nombre
      },
      metadata: {
        peso: orden.pesoTotal,
        items: orden.lineItems.length,
        actualizadoEn: new Date()
      }
    });

    return json({
      success: true,
      envio: {
        id: nuevoEnvio._id,
        guia: nuevoEnvio.guia,
        estado: nuevoEnvio.estado,
        pdfUrl: `/api/envios/${nuevoEnvio._id}/pdf` // Endpoint para descargar PDF
      }
    });

  } catch (error) {
    console.error("Error en shipments.server.js:", error);
    return json(
      { 
        error: error.message || "Error generando envío",
        detalles: error.details 
      },
      { status: 500 }
    );
  }
}

// Funciones auxiliares
async function obtenerOrdenShopify(admin, orderId) {
  const response = await admin.graphql(
    `#graphql
    query GetOrder($id: ID!) {
      order(id: $id) {
        id
        shippingAddress {
          firstName
          lastName
          address1
          city
          zip
          provinceCode
        }
        lineItems(first: 100) {
          edges {
            node {
              title
              quantity
              variant {
                weight
              }
            }
          }
        }
      }
    }`,
    { variables: { id: `gid://shopify/Order/${orderId}` } }
  );

  const data = await response.json();
  const orden = data.data.order;

  // Calcular peso total
  const pesoTotal = orden.lineItems.edges.reduce((total, item) => {
    return total + (item.node.variant?.weight || 0) * item.node.quantity;
  }, 0) * 1000; // Convertir kg a gramos

  return {
    ...orden,
    pesoTotal
  };
}

async function actualizarOrdenShopify(admin, orderId, trackingInfo) {
  const response = await admin.graphql(
    `#graphql
    mutation orderUpdate($input: OrderInput!) {
      orderUpdate(input: $input) {
        order {
          id
          fulfillments {
            trackingInfo {
              number
              url
            }
          }
        }
      }
    }`,
    {
      variables: {
        input: {
          id: `gid://shopify/Order/${orderId}`,
          fulfillments: [{
            trackingInfo: {
              number: trackingInfo.trackingNumber,
              url: trackingInfo.trackingUrl,
              company: "Correos de Costa Rica"
            }
          }]
        }
      }
    }
  );

  return response.json();
}

export function headers() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}

export function loader() {
  return json({ error: "Método no permitido" }, { status: 405 });
}