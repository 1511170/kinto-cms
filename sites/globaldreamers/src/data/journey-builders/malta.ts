import type { JourneyBuilderData } from '../journey-builder-types';

export const maltaData: JourneyBuilderData = {
  country: 'malta',
  countryName: 'Malta',
  countryCode: 'mt',
  currency: 'EUR',
  currencySymbol: '€',
  whatsappNumber: '61449159849',
  
  workPermit: {
    hoursPerWeek: 20,
    notes: '20 horas/semana durante el curso, full-time en vacaciones',
    includedInVisa: true,
    vacationFullTime: true
  },
  
  // 4 CIUDADES de Malta con datos realistas:
  cities: [
    {
      id: 'st-julians',
      name: 'St Julian\'s',
      tagline: 'Vida Nocturna & Estudiantes',
      image: '/images/cities/city-stjulians.png',
      minWage: 8.50,
      avgRentWeekly: { min: 150, max: 220 }, // EUR, habitación compartida
      jobMarket: 'alta',
      livingCostIndex: 1.0,
      description: 'Centro turístico con la mayor concentración de escuelas de inglés. Vida nocturna y ambiente joven.',
      highlights: ['Zona Paceville', 'Escuelas de inglés', 'Playas cercanas', 'Vida nocturna']
    },
    {
      id: 'valletta',
      name: 'Valletta',
      tagline: 'Capital Histórica',
      image: '/images/cities/city-valletta.png',
      minWage: 8.50,
      avgRentWeekly: { min: 140, max: 200 },
      jobMarket: 'media',
      livingCostIndex: 0.95,
      description: 'Capital barroca UNESCO. Cultura, historia y ambiente auténtico maltés.',
      highlights: ['Patrimonio UNESCO', 'Cultura maltés', 'Transporte a toda la isla', 'Historia viva']
    },
    {
      id: 'sliema',
      name: 'Sliema',
      tagline: 'Shopping & Costero',
      image: '/images/cities/city-sliema.png',
      minWage: 8.50,
      avgRentWeekly: { min: 160, max: 240 },
      jobMarket: 'alta',
      livingCostIndex: 1.1,
      description: 'Zona comercial y residencial. Tiendas, restaurantes y paseo marítimo.',
      highlights: ['Shopping center', 'Paseo marítimo', 'Restaurantes', 'Conectividad']
    },
    {
      id: 'gozo',
      name: 'Gozo',
      tagline: 'Tranquilidad & Naturaleza',
      image: '/images/cities/city-gozo.png',
      minWage: 8.50,
      avgRentWeekly: { min: 100, max: 150 },
      jobMarket: 'media',
      livingCostIndex: 0.75,
      description: 'Isla hermana tranquila. Para quienes buscan naturaleza, buceo y paz.',
      highlights: ['Más económico', 'Buceo Blue Hole', 'Naturaleza', 'Tranquilidad']
    }
  ],
  
  courses: [
    {
      id: 'english-intensive',
      name: 'Inglés Intensivo',
      description: 'El programa estrella de Malta. Clases todos los días con profesores nativos.',
      baseCostPerMonth: 450,
      minDuration: 2,
      maxDuration: 12
    },
    {
      id: 'english-standard',
      name: 'Inglés Standard',
      description: 'Ritmo más relajado para combinar estudio y turismo.',
      baseCostPerMonth: 350,
      minDuration: 4,
      maxDuration: 24
    },
    {
      id: 'ielts-preparation',
      name: 'Preparación IELTS',
      description: 'Preparación específica para el examen IELTS.',
      baseCostPerMonth: 500,
      minDuration: 1,
      maxDuration: 6,
      popular: true
    }
  ],
  
  addons: [
    {
      id: 'work-permit',
      name: 'Permiso de Trabajo',
      description: 'Incluido - 20hrs/semana durante el curso',
      icon: 'payments',
      cost: 0,
      included: true
    },
    {
      id: 'homestay',
      name: 'Alojamiento Familiar',
      description: 'Vive con familia maltés, media pensión',
      icon: 'home',
      cost: (duration) => duration * 4.33 * 200,
      included: false
    },
    {
      id: 'shared-apartment',
      name: 'Apartamento Compartido',
      description: 'Habitación en piso compartido con otros estudiantes',
      icon: 'apartment',
      cost: (duration) => duration * 4.33 * 180,
      included: false
    },
    {
      id: 'airport-pickup',
      name: 'Recogida Aeropuerto',
      description: 'Te recibimos en MLA',
      icon: 'flight_land',
      cost: 35,
      included: false
    }
  ],
  
  visaCosts: {
    base: 0, // Sin visa para latinoamericanos (Schengen)
    medical: 0,
    insurance: 300 // Seguro de viaje anual
  },
  
  visaFactors: {
    age: { '18-24': 30, '25-30': 25, '31-35': 20, '36-40': 15, '40+': 10 },
    englishLevel: { beginner: 10, intermediate: 20, advanced: 25, native: 30 },
    workExperience: { none: 10, 'less-than-1': 15, '1-3': 20, '3-5': 25, '5+': 30 },
    financialCapacity: { limited: 15, adequate: 25, comfortable: 35, excellent: 40 }
  },
  
  usps: [
    'Sin visa para latinoamericanos (hasta 90 días, extensible)',
    'Inglés oficial en la UE',
    '300 días de sol al año',
    '40-50% más barato que UK o Irlanda',
    'Acceso Schengen a 26 países europeos'
  ],
  
  postStudyWork: {
    available: false,
    duration: 'N/A',
    description: 'Malta es ideal para estancias cortas de idioma. No ofrece post-study work formal.'
  }
};
