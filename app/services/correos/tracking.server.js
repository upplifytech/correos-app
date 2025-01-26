import axios from "axios";
import { getCorreosToken } from "./auth.server";
import { parseStringPromise } from "fast-xml-parser";

export async function trackEnvio(shopId, numeroGuia) {
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
  return parsed["s:Envelope"]["s:Body"].ccrMovilTrackingResponse.ccrMovilTrackingResult;
}