import { CodigoPostal } from "../app/models/codigosPostales.server.js";
import { getCorreosToken } from "../app/services/correos/auth.server.js";
import axios from "axios";

const CORREOS_API = "http://amistad.correos.go.cr:84/wsAppCorreos.wsAppCorreos.svc";

async function syncPostalData() {
  try {
    const token = await getCorreosToken();
    
    // 1. Obtener todas las provincias
    const provincias = await fetchFromCorreos("/ccrCodProvincia", token);
    
    for (const provincia of provincias) {
      // 2. Obtener cantones por provincia
      const cantones = await fetchFromCorreos("/ccrCodCanton", token, {
        CodProvincia: provincia.Codigo
      });
      
      for (const canton of cantones) {
        // 3. Obtener distritos por cantón
        const distritos = await fetchFromCorreos("/ccrCodDistrito", token, {
          CodProvincia: provincia.Codigo,
          CodCanton: canton.Codigo
        });
        
        for (const distrito of distritos) {
          // 4. Obtener código postal
          const codigoPostal = await fetchFromCorreos("/ccrCodPostal", token, {
            CodProvincia: provincia.Codigo,
            CodCanton: canton.Codigo,
            CodDistrito: distrito.Codigo
          });
          
          // 5. Actualizar MongoDB
          await CodigoPostal.updateOne(
            { codigo: codigoPostal.CodPostal },
            {
              $set: {
                provincia: {
                  codigo: provincia.Codigo,
                  nombre: provincia.Descripcion
                },
                canton: {
                  codigo: canton.Codigo,
                  nombre: canton.Descripcion
                },
                distrito: {
                  codigo: distrito.Codigo,
                  nombre: distrito.Descripcion
                },
                actualizadoEn: new Date()
              }
            },
            { upsert: true }
          );
        }
      }
    }
    
    console.log("✅ Sincronización completada");
  } catch (error) {
    console.error("❌ Error en sincronización:", error);
    process.exit(1);
  }
}

async function fetchFromCorreos(endpoint, token, data = {}) {
  const response = await axios.post(
    `${CORREOS_API}${endpoint}`,
    data,
    {
      headers: {
        "AuthenticationToken": token,
        "Content-Type": "application/json"
      }
    }
  );
  
  return response.data[Object.keys(response.data)[0]];
}

// Ejecutar diariamente
syncPostalData();