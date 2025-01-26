import { Schema, model } from "mongoose";

const EnvioSchema = new Schema({
  shopId: {
    type: String,
    required: true,
    index: true
  },
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  guia: {
    type: String,
    required: true
  },
  estado: {
    type: String,
    enum: ["generada", "en_transito", "entregada"],
    default: "generada"
  },
  fechaGeneracion: {
    type: Date,
    default: Date.now
  },
  pdf: {
    type: String,
    required: true,
    get: (value) => `data:application/pdf;base64,${value}`
  }
});

export const Envio = model("Envio", EnvioSchema);