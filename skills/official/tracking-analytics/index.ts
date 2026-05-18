export { default as GoogleAnalytics } from "./components/GoogleAnalytics.astro";

export const config = {
  name: "tracking-analytics",
  version: "1.0.0",
  description:
    "Google Analytics 4 gtag.js setup with GTM-compatible dataLayer event forwarding for ecommerce, WhatsApp, and site traceability.",
  category: "community",
  author: "KINTO",
  createdFor: "kinto-cms",
  reusable: true,
  dependencies: [],
  configFields: [
    {
      name: "gaMeasurementId",
      type: "string",
      label: "GA4 Measurement ID",
      placeholder: "G-XXXXXXXXXX",
      required: true,
    },
    {
      name: "forwardDataLayerEvents",
      type: "boolean",
      label: "Forward dataLayer events to GA4",
      required: false,
    },
  ],
};

export function install(context: any) {
  context.addComponent("GoogleAnalytics", "./components/GoogleAnalytics.astro");
  console.log("Skill tracking-analytics instalada");
}
