import { Form, redirect } from "@remix-run/react";
import { Credentials } from "~/models/credentials.server";

export async function action({ request, params }) {
  const formData = await request.formData();
  const shopId = formData.get("shopId");
  const correosUser = formData.get("correosUser");
  const correosPassword = formData.get("correosPassword");
  const correosSistema = formData.get("correosSistema");

  await Credentials.create({
    shopId,
    correosUser,
    correosPassword,
    correosSistema,
  });

  return redirect(`/app?shop=${shopId}`);
}

export default function Configure() {
  return (
    <div>
      <h1>Configura tus credenciales de Correos</h1>
      <Form method="post">
        <input type="hidden" name="shopId" value={new URLSearchParams(window.location.search).get("shop")} />
        <div>
          <label>Usuario Correos:</label>
          <input type="text" name="correosUser" required />
        </div>
        <div>
          <label>Contraseña Correos:</label>
          <input type="password" name="correosPassword" required />
        </div>
        <div>
          <label>Sistema (ej: PYMEXPRESS):</label>
          <input type="text" name="correosSistema" required />
        </div>
        <button type="submit">Guardar</button>
      </Form>
    </div>
  );
}