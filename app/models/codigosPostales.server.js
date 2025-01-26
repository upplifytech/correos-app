import { Schema, model } from "mongoose";

const CodigoPostalSchema = new Schema({
  codigo: {
    type: String,
    required: true,
    unique: true,
    match: /^\d{5}$/,
    index: true
  },
  provincia: {
    codigo: { type: String, required: true },
    nombre: { type: String, required: true }
  },
  canton: {
    codigo: { type: String, required: true },
    nombre: { type: String, required: true }
  },
  distrito: {
    codigo: { type: String, required: true },
    nombre: { type: String, required: true }
  },
  actualizadoEn: {
    type: Date,
    default: Date.now,
    index: true
  }
});

export const CodigoPostal = model("CodigoPostal", CodigoPostalSchema);