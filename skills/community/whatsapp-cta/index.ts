export { default as WhatsappFloatingButton } from "./components/WhatsappFloatingButton.astro";
export { default as WhatsappProductCTA } from "./components/WhatsappProductCTA.astro";

export { buildWhatsappUrl, fillTemplate } from "./lib/whatsapp-ga4";

export const config = {
  name: "whatsapp-cta",
  version: "1.0.0",
  description:
    "Botón flotante de WhatsApp + CTA contextual para PDP. Tracking GA4 con eventos separados por origen (whatsapp_click_floating, whatsapp_click_product).",
  category: "community",
  author: "KINTO",
  createdFor: "kinto-cms",
  reusable: true,
  dependencies: [],
  configFields: [
    {
      name: "phone",
      type: "string",
      label: "Teléfono internacional sin signos",
      placeholder: "573147908511",
      required: true,
    },
    {
      name: "gaMeasurementId",
      type: "string",
      label:
        "GA4 Measurement ID (opcional, eventos requieren GTM o GA4 cargado por separado)",
      required: false,
    },
  ],
};

export function install(context: any) {
  context.addComponent(
    "WhatsappFloatingButton",
    "./components/WhatsappFloatingButton.astro",
  );
  context.addComponent(
    "WhatsappProductCTA",
    "./components/WhatsappProductCTA.astro",
  );
  console.log("Skill whatsapp-cta instalada");
}
