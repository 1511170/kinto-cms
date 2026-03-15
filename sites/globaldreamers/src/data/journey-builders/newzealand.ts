import type { JourneyBuilderData } from '../journey-builder-types';

export const newzealandData: JourneyBuilderData = {
  country: 'newzealand',
  countryName: 'Nueva Zelanda',
  countryCode: 'nz',
  currency: 'NZD',
  currencySymbol: '$',
  whatsappNumber: '61449159849',
  
  workPermit: {
    hoursPerWeek: 20,
    notes: '20 horas/semana durante el curso, full-time en vacaciones (Navidad, invierno)',
    includedInVisa: true,
    vacationFullTime: true
  },
  
  // 4 CIUDADES principales:
  cities: [
    {
      id: 'auckland',
      name: 'Auckland',
      tagline: 'Ciudad de las Velas',
      image: '/images/cities/city-auckland.png',
      minWage: 23.65,
      avgRentWeekly: { min: 220, max: 320 }, // NZD, habitación compartida
      jobMarket: 'muy_alta',
      livingCostIndex: 1.15,
      description: 'Ciudad más grande. Multicultural, puertos, islas y el skyline icónico.',
      highlights: ['Sky Tower', 'Islas del Hauraki', 'Multicultural', 'Mayor oferta laboral']
    },
    {
      id: 'wellington',
      name: 'Wellington',
      tagline: 'Capital Creativa',
      image: '/images/cities/city-wellington.png',
      minWage: 23.65,
      avgRentWeekly: { min: 200, max: 290 },
      jobMarket: 'alta',
      livingCostIndex: 1.0,
      description: 'Capital cultural. Viento famoso, café, cerveza artesanal y creativos.',
      highlights: ['Café culture', 'Cerveza artesanal', 'Te Papa museum', 'Tech hub']
    },
    {
      id: 'christchurch',
      name: 'Christchurch',
      tagline: 'Jardín de Canterbury',
      image: '/images/cities/city-christchurch.png',
      minWage: 23.65,
      avgRentWeekly: { min: 160, max: 240 },
      jobMarket: 'media-alta',
      livingCostIndex: 0.9,
      description: 'La ciudad en reconstrucción. Jardines botánicos, innovación y aventura.',
      highlights: ['Jardines botánicos', 'Reconstrucción innovadora', 'Cerca de ski', 'Más económica']
    },
    {
      id: 'queenstown',
      name: 'Queenstown',
      tagline: 'Capital Aventura',
      image: '/images/cities/city-queenstown.png',
      minWage: 23.65,
      avgRentWeekly: { min: 250, max: 350 },
      jobMarket: 'media',
      livingCostIndex: 1.2,
      description: 'Paraíso de deportes extremos. Bungee, ski, y paisajes de película.',
      highlights: ['Bungee jumping', 'Esquí mundial', 'Lago Wakatipu', 'Deportes extremos']
    }
  ],
  
  courses: [
    {
      id: 'english-general',
      name: 'Inglés General',
      description: 'Mejora tu inglés en el paraíso. Accent neutral kiwi.',
      baseCostPerMonth: 750,
      minDuration: 4,
      maxDuration: 24
    },
    {
      id: 'agriculture',
      name: 'Agricultura & Horticultura',
      description: 'NZ líder mundial en agro. Programas prácticos con trabajo garantizado.',
      baseCostPerMonth: 900,
      minDuration: 6,
      maxDuration: 24,
      popular: true,
      coOp: true
    },
    {
      id: 'tourism-hospitality',
      name: 'Turismo & Hotelería',
      description: 'Industria turística de clase mundial con alta empleabilidad.',
      baseCostPerMonth: 800,
      minDuration: 6,
      maxDuration: 24
    },
    {
      id: 'university',
      name: 'Universidad',
      description: 'Grados y Masters con alta calidad académica.',
      baseCostPerMonth: 2200,
      minDuration: 12,
      maxDuration: 48
    }
  ],
  
  addons: [
    {
      id: 'work-permit',
      name: 'Permiso de Trabajo',
      description: 'Incluido en visa de estudiante - 20hrs/semana',
      icon: 'payments',
      cost: 0,
      included: true
    },
    {
      id: 'homestay',
      name: 'Alojamiento Familiar',
      description: 'Vive con familia kiwi',
      icon: 'home',
      cost: (duration) => duration * 4.33 * 280,
      included: false
    },
    {
      id: 'medical-insurance',
      name: 'Seguro Médico',
      description: 'Cobertura estudiantil completa',
      icon: 'medical_services',
      cost: (duration) => duration * 65,
      included: false
    },
    {
      id: 'airport-pickup',
      name: 'Recogida Aeropuerto',
      description: 'Te recibimos en AKL/CHC',
      icon: 'flight_land',
      cost: 80,
      included: false
    }
  ],
  
  visaCosts: {
    base: 330, // NZD - Fee de aplicación
    medical: 200,
    insurance: 520, // Anual
    insurancePerMonth: 65
  },
  
  visaFactors: {
    age: { '18-24': 25, '25-30': 20, '31-35': 15, '36-40': 10, '40+': 5 },
    englishLevel: { beginner: 5, intermediate: 15, advanced: 25, native: 30 },
    workExperience: { none: 5, 'less-than-1': 10, '1-3': 15, '3-5': 20, '5+': 25 },
    financialCapacity: { limited: 10, adequate: 20, comfortable: 30, excellent: 35 }
  },
  
  usps: [
    'Salario mínimo alto ($23.65 NZD/hr)',
    'Calidad de vida #1 del mundo',
    'País más seguro (índice de paz)',
    'Post-study work visa disponible',
    'Naturaleza incomparable'
  ],
  
  postStudyWork: {
    available: true,
    duration: '1-3 años',
    description: 'Post-study work visa según duración del programa. Pathway to residence disponible.'
  }
};
