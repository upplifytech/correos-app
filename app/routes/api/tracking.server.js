import axios from "axios";
import { getCorreosToken } from "./auth.server";
import { parseStringPromise } from "fast-xml-parser";

export async function trackEnvio(shopId, numeroGuia) {
  try {
    const token = await getCorreosToken(shopId);
    
    const response = await axios.post(
      "http://amistad.correos.go.cr:84/wsAppCorreos.wsAppCorreos.svc/ccrMovilTracking",
      `<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
         <soap:Header>
           <AuthenticationToken>${token}</AuthenticationToken>
         </soap:Header>
         <soap:Body>
           <ccrMovilTracking>
             <NumeroEnvio>${numeroGuia}</NumeroEnvio>
           </ccrMovilTracking>
         </soap:Body>
       </soap:Envelope>`,
      {
        headers: {
          "Content-Type": "application/soap+xml",
        },
      }
    );

    const parsed = await parseStringPromise(response.data);
    const resultado = parsed["s:Envelope"]["s:Body"].ccrMovilTrackingResponse.ccrMovilTrackingResult;
    
    return {
      estado: resultado.Estado,
      ultimaActualizacion: resultado.FechaHora,
      ubicacion: resultado.Unidad,
      historial: resultado.Eventos?.ccrEvento?.map(evento => ({
        fecha: evento.FechaHora,
        evento: evento.Evento,
        ubicacion: evento.Unidad
      })) || []
    };
    
  } catch (error) {
    console.error("Error en tracking:", error.response?.data || error.message);
    throw new Error("Error obteniendo información de seguimiento");
  }
}