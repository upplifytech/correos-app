import { redirect } from "@shopify/remix-oxygen";
import { Credentials } from "../models/credentials.server";

export async function requireCorreosConfig(request) {
  const { session } = await authenticate.admin(request);
  const credentials = await Credentials.findOne({ shopId: session.shop });
  
  if (!credentials) {
    throw redirect(`/auth/configure?shop=${session.shop}`);
  }
  
  return { shop: session.shop, credentials };
}