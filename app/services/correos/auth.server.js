import axios from "axios";
import { Credentials } from "~/models/credentials.server";

export async function getCorreosToken(shopId) {
  // Obtener credenciales desde MongoDB
  const credentials = await Credentials.findOne({ shopId });
  if (!credentials) throw new Error("Credenciales no configuradas");

  // Usar las credenciales descifradas automáticamente (gracias a los getters de Mongoose)
  const { correosUser: username, correosPassword: password, correosSistema: sistema } = credentials;

  const response = await axios.post("https://servicios.correos.go.cr:442/Token/authenticate", {
    Username: username,
    Password: password,
    Sistema: sistema,
  });

  return response.data.token;
}