# Skill: forms-web3forms

Formularios de contacto funcionales sin backend propio, usando Web3Forms.

## Qué hace

- Envía formularios a email del cliente vía Web3Forms (gratis)
- Sin branding, sin límites estrictos
- Validación del lado cliente
- Mensajes de éxito/error incluidos

## Instalación

```bash
node scripts/skill-add.js forms-web3forms
```

## Configuración

1. Obtener API Key gratis en: https://web3forms.com/
2. Configurar en `config/site.config.ts`:

```typescript
export default {
  // ... otra config
  forms: {
    web3formsKey: 'TU-API-KEY-AQUI'  // Obtener en web3forms.com
  }
};
```

## Uso

```astro
---
import { ContactForm } from '../../../skills/community/forms-web3forms';
---

<ContactForm 
  title="Contáctanos"
  subtitle="Te responderemos en 24 horas"
  recipientEmail="comercial@serviworldlogistics.com"
/>
```

## Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `title` | string | "Contáctanos" | Título del formulario |
| `subtitle` | string | "" | Subtítulo descriptivo |
| `recipientEmail` | string | required | Email donde llegan los mensajes |
| `submitLabel` | string | "Enviar mensaje" | Texto del botón |
| `showPhone` | boolean | true | Mostrar campo teléfono |
| `showCompany` | boolean | true | Mostrar campo empresa |
| `serviceSelect` | boolean | false | Selector de servicios |

## Sin Configuración (Modo Demo)

Si no hay API key configurada, el formulario muestra un mensaje de éxito simulado para demo.
