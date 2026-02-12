# Skill: webflow-effects

Efectos premium tipo Webflow - animaciones GSAP, micro-interacciones, diseño de alta gama.

## Qué añade

- 🎬 **GSAP ScrollTrigger** - Animaciones al hacer scroll
- ✨ **Micro-interacciones** - Hover effects sofisticados
- 🎯 **Stagger animations** - Elementos que aparecen secuencialmente
- 🔮 **Glassmorphism** - Efectos de vidrio y blur
- 🌊 **Parallax suave** - Profundidad visual
- 💎 **Tipografía premium** - Google Fonts optimizadas
- 🖼️ **Imágenes Unsplash** - Fotos reales de alta calidad

## Instalación

```bash
kinto skill add webflow-effects --site=serviworldlogistics
npm install gsap --legacy-peer-deps
```

## Componentes incluidos

### `<AnimatedHero />`
Hero con texto animado, gradientes dinámicos, parallax.

### `<PremiumCard />`
Cards con hover 3D, glassmorphism, glow effects.

### `<StaggerGrid />`
Grids donde los items aparecen con stagger animation.

### `<ParallaxSection />`
Secciones con movimiento parallax en scroll.

### `<MagneticButton />`
Botones que siguen el cursor (magnetic effect).

## Uso

```astro
---
import AnimatedHero from '../../../skills/community/webflow-effects/components/AnimatedHero.astro';
---

<AnimatedHero 
  title="Conectamos tu negocio"
  highlight="con el mundo"
  subtitle="Soluciones logísticas globales"
/>
```

## Scripts automáticos

La skill inyecta automáticamente:
- `gsap.min.js` - Animaciones
- `scroll-trigger.js` - Scroll animations
- `custom-animations.js` - Configuración del sitio

## Efectos CSS incluidos

- `.animate-fade-up` - Fade + translate up
- `.animate-scale-in` - Scale from 0.8 to 1
- `.glass-card` - Glassmorphism effect
- `.gradient-text` - Texto con gradiente animado
- `.hover-lift` - Elevación en hover
- `.magnetic` - Efecto magnético

## Configuración

En `site.config.ts`:

```typescript
webflowEffects: {
  enabled: true,
  animations: ['scroll', 'hover', 'pageLoad'],
  reducedMotion: 'respect' // 'respect' | 'ignore'
}
```
