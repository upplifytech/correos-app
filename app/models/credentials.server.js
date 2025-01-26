import { Schema, model } from "mongoose";
import { encrypt, decrypt } from "../utils/crypto.server";

const CredentialsSchema = new Schema({
  shopId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  correosUser: {  // Nuevo campo
    type: String,
    set: (v) => encrypt(v),
    get: (v) => decrypt(v),
  },
  correosPassword: {  // Nuevo campo
    type: String,
    set: (v) => encrypt(v),
    get: (v) => decrypt(v),
  },
  correosSistema: {  // Nuevo campo
    type: String,
    set: (v) => encrypt(v),
    get: (v) => decrypt(v),
  },
});

export const Credentials = model("Credentials", CredentialsSchema);