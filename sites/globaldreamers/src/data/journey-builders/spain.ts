import type { JourneyBuilderData } from '../journey-builder-types';

export const spainData: JourneyBuilderData = {
  country: 'spain',
  countryName: 'España',
  countryCode: 'es',
  currency: 'EUR',
  currencySymbol: '€',
  whatsappNumber: '61449159849',
  
  workPermit: {
    hoursPerWeek: 30, // ¡España permite más horas!
    notes: '30 horas/semana (más que otros países europeos), full-time en vacaciones',
    includedInVisa: true,
    vacationFullTime: true
  },
  
  // 5 CIUDADES principales:
  cities: [
    {
      id: 'barcelona',
      name: 'Barcelona',
      tagline: 'Arte & Mediterráneo',
      image: '/images/cities/city-barcelona.png',
      minWage: 8.45, // SMI mensual dividido
      avgRentWeekly: { min: 140, max: 220 }, // EUR, habitación compartida
      jobMarket: 'alta',
      livingCostIndex: 1.15,
      description: 'Capital modernista. Gaudí, playas, tecnología y el mejor estilo de vida.',
      highlights: ['Sagrada Familia', 'Playas urbanas', 'Tech hub', 'Gastronomía']
    },
    {
      id: 'madrid',
      name: 'Madrid',
      tagline: 'Cultura & Negocios',
      image: '/images/cities/city-madrid.png',
      minWage: 8.45,
      avgRentWeekly: { min: 150, max: 240 },
      jobMarket: 'muy_alta',
      livingCostIndex: 1.1,
      description: 'Capital de España. Museos, negocios, vida nocturna y corazón latinoamericano.',
      highlights: ['Museo del Prado', 'Negocios', 'Vida nocturna', 'Comunidad latina']
    },
    {
      id: 'valencia',
      name: 'Valencia',
      tagline: 'Sol & Paella',
      image: '/images/cities/city-valencia.png',
      minWage: 8.45,
      avgRentWeekly: { min: 100, max: 160 },
      jobMarket: 'media-alta',
      livingCostIndex: 0.85,
      description: 'Tercera ciudad. Playa, ciencia, gastronomía y mucho más barata.',
      highlights: ['Ciudad Artes y Ciencias', 'Paella origen', 'Playas', 'Más económica']
    },
    {
      id: 'sevilla',
      name: 'Sevilla',
      tagline: 'Pasión & Tradición',
      image: '/images/cities/city-sevilla.png',
      minWage: 8.45,
      avgRentWeekly: { min: 90, max: 140 },
      jobMarket: 'media',
      livingCostIndex: 0.75,
      description: 'Corazón andaluz. Flamenco, tapas, historia y el clima más cálido.',
      highlights: ['Giralda', 'Flamenco', 'Feria de Abril', 'Muy económico']
    },
    {
      id: 'salamanca',
      name: 'Salamanca',
      tagline: 'Universidad Histórica',
      image: '/images/cities/city-salamanca.png',
      minWage: 8.45,
      avgRentWeekly: { min: 80, max: 120 },
      jobMarket: 'media',
      livingCostIndex: 0.7,
      description: 'Ciudad universitaria. La universidad más antigua de España.',
      highlights: ['Uni. más antigua', 'Pura castellano', 'Vida estudiantil', 'Económica']
    }
  ],
  
  courses: [
    {
      id: 'spanish-intensive',
      name: 'Español Intensivo',
      description: 'Aprende español donde nació. La integración más fácil para latinos.',
      baseCostPerMonth: 550,
      minDuration: 4,
      maxDuration: 48
    },
    {
      id: 'spanish-dele',
      name: 'Preparación DELE',
      description: 'Certificación oficial del español.',
      baseCostPerMonth: 600,
      minDuration: 1,
      maxDuration: 12,
      popular: true
    },
    {
      id: 'gastronomy',
      name: 'Gastronomía & Cocina',
      description: 'Escuela de cocina española. Tapas, paella, alta cocina.',
      baseCostPerMonth: 800,
      minDuration: 3,
      maxDuration: 12
    },
    {
      id: 'university',
      name: 'Universidad',
      description: 'Grados y Masters en español.',
      baseCostPerMonth: 1200,
      minDuration: 12,
      maxDuration: 48
    }
  ],
  
  addons: [
    {
      id: 'work-permit',
      name: 'Permiso de Trabajo',
      description: 'Incluido - 30hrs/semana (¡más que otros países!)',
      icon: 'payments',
      cost: 0,
      included: true
    },
    {
      id: 'nie',
      name: 'Trámite NIE',
      description: 'Número de Identidad de Extranjero necesario',
      icon: 'badge',
      cost: 15,
      included: false
    },
    {
      id: 'shared-flat',
      name: 'Piso Compartido',
      description: 'Habitación en piso compartido',
      icon: 'apartment',
      cost: (duration) => duration * 4.33 * 350,
      included: false
    },
    {
      id: 'airport-pickup',
      name: 'Recogida Aeropuerto',
      description: 'Te recibimos en BCN/MAD',
      icon: 'flight_land',
      cost: 50,
      included: false
    }
  ],
  
  visaCosts: {
    base: 80, // Visa D de estudios
    medical: 0,
    insurance: 400 // Seguro anual
  },
  
  visaFactors: {
    age: { '18-24': 25, '25-30': 20, '31-35': 15, '36-40': 10, '40+': 5 },
    englishLevel: { beginner: 20, intermediate: 25, advanced: 30, native: 35 }, // Para español es diferente
    workExperience: { none: 5, 'less-than-1': 10, '1-3': 15, '3-5': 20, '5+': 25 },
    financialCapacity: { limited: 10, adequate: 20, comfortable: 30, excellent: 35 }
  },
  
  usps: [
    '30 horas/semana permitidas (más que Europa)',
    'Sin barrera de idioma para latinos',
    'Clima mediterráneo 300 días de sol',
    'Gastronomía de fama mundial',
    'Acceso Schengen a 26 países'
  ],
  
  postStudyWork: {
    available: true,
    duration: '1 año',
    description: 'Permiso de búsqueda de empleo por 1 año post-grado. Requiere graduación.'
  }
};
