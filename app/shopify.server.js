import "@shopify/shopify-app-remix/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
} from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";
import { Credentials } from "./models/credentials.server"; // Añadir importación
import { redirect } from "@shopify/remix-oxygen"; // Añadir importación

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.October24,
  scopes: process.env.SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  future: {
    unstable_newEmbeddedAuthStrategy: true,
    removeRest: true,
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

// Función de autenticación personalizada
export const authenticate = async (request, options) => {
  const response = await shopify.authenticate(request, options);
  
  // Verificar si la tienda tiene credenciales configuradas
  const shop = response.session.shop;
  const credentials = await Credentials.findOne({ shopId: shop });
  
  if (!credentials) {
    throw redirect(`/auth/configure?shop=${shop}`);
  }

  return response;
};

// Función de login personalizada
export const login = async (args) => {
  const response = await shopify.login(args);
  
  // Si es una nueva instalación, forzar configuración
  if (args.request.url.includes("embedded")) {
    const url = new URL(args.request.url);
    const shop = url.searchParams.get("shop");
    
    if (shop && !(await Credentials.findOne({ shopId: shop }))) {
      throw redirect(`/auth/configure?shop=${shop}`);
    }
  }
  
  return response;
};

export default shopify;
export const apiVersion = ApiVersion.October24;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const unauthenticated = shopify.unauthenticated;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;