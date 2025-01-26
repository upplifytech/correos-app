import { CodigoPostal } from "../models/codigosPostales.server.js";

export async function validarCodigoPostal(codigo) {
  const registro = await CodigoPostal.findOne({ codigo }).lean();
  
  if (!registro) {
    return {
      valido: false,
      error: "Código postal no encontrado"
    };
  }
  
  const diasDesdeActualizacion = Math.floor(
    (Date.now() - new Date(registro.actualizadoEn)) / (1000 * 3600 * 24)
  );
  
  return {
    valido: true,
    datos: {
      provincia: registro.provincia,
      canton: registro.canton,
      distrito: registro.distrito
    },
    metadata: {
      actualizadoHace: `${diasDesdeActualizacion} días`,
      confiabilidad: diasDesdeActualizacion < 7 ? 0.95 : 0.80
    }
  };
}