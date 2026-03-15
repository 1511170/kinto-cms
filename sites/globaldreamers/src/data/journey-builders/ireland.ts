// Ireland Journey Builder Data
import type { JourneyBuilderData } from '../journey-builder-types';

export const irelandData: JourneyBuilderData = {
  country: 'ireland',
  countryName: 'Irlanda',
  countryCode: 'ie',
  currency: 'EUR',
  currencySymbol: '€',
  whatsappNumber: '61449159849',
  
  workPermit: {
    hoursPerWeek: 20,
    notes: '20 horas/semana, 40 horas/semana en vacaciones (Junio-Agosto, Diciembre-Enero)',
    includedInVisa: true,
    vacationFullTime: true
  },
  
  cities: [
    {
      id: 'dublin',
      name: 'Dublín',
      tagline: 'Tech Hub Europeo',
      image: '/images/cities/city-dublin.png',
      minWage: 12.70,
      avgRentWeekly: { min: 180, max: 260 },
      jobMarket: 'muy_alta',
      livingCostIndex: 1.2,
      description: 'Sede europea de Google, Meta, Apple, LinkedIn. Único país angloparlante en la UE.',
      highlights: ['Sedes Google/Meta/Apple', 'Único inglés en UE', 'Salarios altos', 'Acceso a Europa']
    },
    {
      id: 'cork',
      name: 'Cork',
      tagline: 'Segunda Ciudad',
      image: '/images/cities/city-cork.png',
      minWage: 12.70,
      avgRentWeekly: { min: 140, max: 200 },
      jobMarket: 'media-alta',
      livingCostIndex: 0.9,
      description: 'Más barata que Dublín, pharma hub y ambiente universitario vibrante.',
      highlights: ['Más económica', 'Pharma hub', 'Puerto importante', 'Universidad UCC']
    },
    {
      id: 'galway',
      name: 'Galway',
      tagline: 'Cultural & Artística',
      image: '/images/cities/galway-ireland.png',
      minWage: 12.70,
      avgRentWeekly: { min: 130, max: 190 },
      jobMarket: 'media',
      livingCostIndex: 0.85,
      description: 'Ciudad universitaria pequeña, música tradicional irlandesa y costa atlántica.',
      highlights: ['Música tradicional', 'Universidad NUIG', 'Costa atlántica', 'Más pequeña/acogedora']
    }
  ],
  
  courses: [
    {
      id: 'english',
      name: 'Inglés General',
      description: 'Inglés en la UE sin necesidad de visa Schengen separada.',
      baseCostPerMonth: 700,
      minDuration: 4,
      maxDuration: 24
    },
    {
      id: 'business-tech',
      name: 'Business / Tech',
      description: 'Preparación para trabajar en el hub tecnológico europeo.',
      baseCostPerMonth: 1100,
      minDuration: 6,
      maxDuration: 24,
      popular: true
    },
    {
      id: 'university',
      name: 'Universidad',
      description: 'Educación europea de calidad en inglés.',
      baseCostPerMonth: 1800,
      minDuration: 12,
      maxDuration: 48
    }
  ],
  
  addons: [
    {
      id: 'work-permit',
      name: 'Permiso de Trabajo',
      description: 'Stamp 2 incluye trabajo 20h/semana',
      icon: 'payments',
      cost: 0,
      included: true
    },
    {
      id: 'stay-back',
      name: 'Stay Back Visa',
      description: '1-2 años para buscar trabajo post-graduación',
      icon: 'badge',
      cost: 0,
      included: false
    },
    {
      id: 'homestay',
      name: 'Alojamiento',
      description: 'Shared accommodation',
      icon: 'home',
      cost: (duration) => duration * 4.33 * 220,
      included: false
    },
    {
      id: 'airport-pickup',
      name: 'Recogida Aeropuerto',
      description: 'DUB/ORK/etc',
      icon: 'flight_land',
      cost: 60,
      included: false
    }
  ],
  
  visaCosts: {
    base: 60, // Register with GNIB
    medical: 150,
    insurance: 550 // Irish Life Health
  },
  
  visaFactors: {
    age: { '18-24': 25, '25-30': 20, '31-35': 15, '36-40': 10, '40+': 5 },
    englishLevel: { beginner: 5, intermediate: 15, advanced: 25, native: 30 },
    workExperience: { none: 5, 'less-than-1': 10, '1-3': 15, '3-5': 20, '5+': 25 },
    financialCapacity: { limited: 10, adequate: 20, comfortable: 30, excellent: 35 }
  },
  
  usps: [
    'Único país angloparlante en la Unión Europea',
    'Stay Back Visa: 1-2 años para buscar trabajo',
    'Tech hub: Google, Meta, Apple, LinkedIn HQ',
    'Salario mínimo más alto de Europa (€12.70/hr)',
    'Acceso a Europa Schengen para viajar'
  ],
  
  postStudyWork: {
    available: true,
    duration: '1-2 años',
    description: 'Third Level Graduate Scheme permite 1-2 años para buscar empleo.'
  }
};
