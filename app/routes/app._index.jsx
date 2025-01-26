import { useEffect, useState } from "react";
import { useFetcher } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  Box,
  List,
  Link,
  InlineStack,
  TextField,
  Icon,
  Banner,
  Badge
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { ProductsMajor, ChecklistIcon, ShipmentIcon } from "@shopify/polaris-icons";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

export default function Index() {
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  const [trackingNumber, setTrackingNumber] = useState("");
  const [shipments, setShipments] = useState([]);
  const [error, setError] = useState(null);

  const isLoading = ["loading", "submitting"].includes(fetcher.state);

  // Función para generar guía
  const generateShippingLabel = () => {
    fetcher.submit(
      { 
        action: "generate", 
        shop: new URL(window.location).searchParams.get("shop") 
      }, 
      { 
        method: "POST",
        action: "/api/shipments" 
      }
    );
  };

  // Función para buscar tracking
  const trackPackage = () => {
    if (!trackingNumber) {
      setError("Por favor ingrese un número de seguimiento");
      return;
    }
    fetcher.load(`/api/tracking/${trackingNumber}`);
  };

  // Efecto para manejar resultados
  useEffect(() => {
    if (fetcher.data) {
      if (fetcher.data.error) {
        shopify.toast.show(fetcher.data.error);
        setError(fetcher.data.error);
      } else if (fetcher.data.guia) {
        shopify.toast.show("Guía generada exitosamente");
        setShipments(prev => [fetcher.data, ...prev]);
      }
    }
  }, [fetcher.data]);

  // Añadir useEffect para cargar envíos al iniciar
  useEffect(() => {
    fetcher.load("/api/shipments");
  }, []);

  // Modificar el listado:
  {shipments.length === 0 ? (
    <Banner>
      <p>No hay envíos generados recientemente</p>
    </Banner>
  ) : (
    <List>
      {fetcher.data?.shipments?.map((shipment) => (
        <List.Item key={shipment._id}>
          <InlineStack align="space-between" blockAlign="center">
            <Text as="span" variant="bodyMd">
              Guía: {shipment.guia}
              <Badge tone={shipment.estado === "generada" ? "info" : "success"}>
                {shipment.estado}
              </Badge>
            </Text>
            <Button
              onClick={() => window.open(shipment.pdf, "_blank")}
              variant="plain"
            >
              Descargar PDF
            </Button>
          </InlineStack>
        </List.Item>
      ))}
    </List>
  )}

  return (
    <Page>
      <TitleBar title="Correos de Costa Rica - Envíos">
        <Button variant="primary" onClick={generateShippingLabel} loading={isLoading}>
          Generar Guía de Envío
        </Button>
      </TitleBar>

      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="500">
                {/* Sección de Seguimiento */}
                <BlockStack gap="200">
                  <InlineStack align="space-between" blockAlign="center">
                    <Text as="h2" variant="headingMd">
                      <Icon source={ShipmentIcon} /> Seguimiento de Paquetes
                    </Text>
                    <InlineStack gap="200">
                      <TextField
                        label=""
                        value={trackingNumber}
                        onChange={setTrackingNumber}
                        placeholder="Ingrese número de guía"
                        autoComplete="off"
                      />
                      <Button onClick={trackPackage} loading={isLoading}>
                        Rastrear
                      </Button>
                    </InlineStack>
                  </InlineStack>

                  {error && (
                    <Banner tone="critical">
                      <p>{error}</p>
                    </Banner>
                  )}

                  {fetcher.data?.tracking && (
                    <Box padding="400" background="bg-surface-active">
                      <Text variant="headingMd">Estado del Envío:</Text>
                      <Badge tone={fetcher.data.tracking.estado === "Entregado" ? "success" : "attention"}>
                        {fetcher.data.tracking.estado}
                      </Badge>
                      <Text as="p">Última actualización: {fetcher.data.tracking.fecha}</Text>
                    </Box>
                  )}
                </BlockStack>

                {/* Listado de Envíos Recientes */}
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    <Icon source={ChecklistIcon} /> Envíos Recientes
                  </Text>
                  {shipments.length === 0 ? (
                    <Banner>
                      <p>No hay envíos generados recientemente</p>
                    </Banner>
                  ) : (
                    <List>
                      {shipments.map((shipment, index) => (
                        <List.Item key={index}>
                          <InlineStack align="space-between" blockAlign="center">
                            <Text as="span" variant="bodyMd">
                              Guía: {shipment.guia}
                            </Text>
                            <Button
                              url={`https://www.correos.go.cr/rastreo/consulta_envios/rastreo.aspx?codigo=${shipment.guia}`}
                              target="_blank"
                              variant="plain"
                            >
                              Ver Detalles
                            </Button>
                          </InlineStack>
                        </List.Item>
                      ))}
                    </List>
                  )}
                </BlockStack>
              </BlockStack>
            </Card>
          </Layout.Section>

          {/* Sección Lateral de Información */}
          <Layout.Section variant="oneThird">
            <BlockStack gap="500">
              <Card>
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    <Icon source={ProductsMajor} /> Cómo usar la app
                  </Text>
                  <List>
                    <List.Item>
                      Genera guías de envío directamente desde las órdenes de Shopify
                    </List.Item>
                    <List.Item>
                      Rastrea paquetes en tiempo real con Correos de Costa Rica
                    </List.Item>
                    <List.Item>
                      Configura tus preferencias de envío en los ajustes
                    </List.Item>
                  </List>
                </BlockStack>
              </Card>

              <Card>
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    Soporte y Contacto
                  </Text>
                  <List>
                    <List.Item>
                      <Link url="mailto:soporte@tudominio.com" removeUnderline>
                        Correo de Soporte
                      </Link>
                    </List.Item>
                    <List.Item>
                      <Link url="https://correos.go.cr" target="_blank" removeUnderline>
                        Sitio Oficial Correos
                      </Link>
                    </List.Item>
                    <List.Item>
                      <Link url="/settings" removeUnderline>
                        Configuración de la App
                      </Link>
                    </List.Item>
                  </List>
                </BlockStack>
              </Card>
            </BlockStack>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
