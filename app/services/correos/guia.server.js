// app/services/correos/guia.server.js
import axios from "axios";
import { parseStringPromise } from "fast-xml-parser";
import { getCorreosToken } from "./auth.server";

const CORREOS_SOAP_URL = "http://amistad.correos.go.cr:84/wsAppCorreos.wsAppCorreos.svc";

export async function generarGuia(shopId, datosEnvio) {
  try {
    const token = await getCorreosToken(shopId);
    
    const response = await axios.post(
      `${CORREOS_SOAP_URL}/ccrGenerarGuia`,
      `<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
         <soap:Header>
           <AuthenticationToken>${token}</AuthenticationToken>
         </soap:Header>
         <soap:Body>
           <ccrGenerarGuia/>
         </soap:Body>
       </soap:Envelope>`,
      {
        headers: {
          "Content-Type": "application/soap+xml",
        },
      }
    );

    const parsed = await parseStringPromise(response.data);
    return {
      numeroGuia: parsed[...].NumeroEnvio,
      pdf: parsed["s:Envelope"]["s:Body"].ccrRegistroEnvioResponse.ccrRegistroEnvioResult.PDF
    };
    
  } catch (error) {
    console.error("Error generando guía:", error.response?.data || error.message);
    throw new Error("Error al generar guía: " + (error.response?.data || error.message));
  }
}